// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React from 'react';
import {Modal} from 'react-bootstrap';
import {FormattedMessage} from 'react-intl';

import type {FileInfo} from '@mattermost/types/files';
import type {Post} from '@mattermost/types/posts';

import {getFileDownloadUrl, getFilePreviewUrl, getFileUrl} from 'mattermost-redux/utils/file_utils';

import ArchivedPreview from 'components/archived_preview';
import AudioVideoPreview from 'components/audio_video_preview';
import CodePreview, {hasSupportedLanguage} from 'components/code_preview';
import FileInfoPreview from 'components/file_info_preview';
import LoadingImagePreview from 'components/loading_image_preview';
import type {Props as PDFPreviewComponentProps} from 'components/pdf_preview';

import Constants, {FileTypes, ZoomSettings} from 'utils/constants';
import * as Keyboard from 'utils/keyboard';
import * as Utils from 'utils/utils';

import type {FilePreviewComponent} from 'types/store/plugins';

import FilePreviewModalFooter from './file_preview_modal_footer/file_preview_modal_footer';
import FilePreviewModalHeader from './file_preview_modal_header/file_preview_modal_header';
import ImagePreview from './image_preview';
import PopoverBar from './popover_bar';
import {isFileInfo, isLinkInfo} from './types';
import type {LinkInfo} from './types';

import './file_preview_modal.scss';

const PDFPreview = React.lazy<React.ComponentType<PDFPreviewComponentProps>>(() => import('components/pdf_preview'));

const KeyCodes = Constants.KeyCodes;

export type Props = {
    canDownloadFiles: boolean;
    enablePublicLink: boolean;

    /**
     * List of FileInfo to view
     **/
    fileInfos: Array<FileInfo | LinkInfo>;

    isMobileView: boolean;
    pluginFilePreviewComponents: FilePreviewComponent[];
    onExited: () => void;

    /**
     * The post the files are attached to
     * Either postId or post can be passed to FilePreviewModal
     */
    post?: Post;

    /**
     * The index number of starting image
     **/
    startIndex: number;
}

type State = {
    show: boolean;
    imageIndex: number;
    imageHeight: number | string;
    loaded: Record<number, boolean>;
    prevFileInfosCount: number;
    progress: Record<number, number>;
    showCloseBtn: boolean;
    showZoomControls: boolean;
    scale: Record<number, number>;
    fitScale: Record<number, number>;
    panOffset: Record<number, PanOffset>;
    fileIdentities: string[];
    content: string;
}

export type PanOffset = {x: number; y: number};

const ORIGIN: PanOffset = {x: 0, y: 0};

export default class FilePreviewModal extends React.PureComponent<Props, State> {
    static defaultProps = {
        fileInfos: [],
        startIndex: 0,
        pluginFilePreviewComponents: [],
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            show: true,
            imageIndex: this.props.startIndex,
            imageHeight: '100%',
            loaded: Utils.fillRecord(false, this.props.fileInfos.length),
            prevFileInfosCount: 0,
            progress: Utils.fillRecord(0, this.props.fileInfos.length),
            showCloseBtn: false,
            showZoomControls: false,
            scale: Utils.fillRecord(ZoomSettings.DEFAULT_SCALE, this.props.fileInfos.length),
            fitScale: Utils.fillRecord(ZoomSettings.DEFAULT_SCALE, this.props.fileInfos.length),
            panOffset: {},
            fileIdentities: [],
            content: '',
        };
    }

    // A file's identity, not its position. A post edit can swap the attachment at
    // an index without changing the list length, and the zoom/pan state for that
    // index has to reset when it does. Namespacing keeps a file id from colliding
    // with an external link that happens to be the same string.
    static getFileIdentity(fileInfo: FileInfo | LinkInfo): string {
        return isFileInfo(fileInfo) ? `id:${fileInfo.id}` : `link:${(fileInfo as LinkInfo).link}`;
    }

    handleNext = () => {
        let id = this.state.imageIndex + 1;
        if (id > this.props.fileInfos.length - 1) {
            id = 0;
        }
        this.showImage(id);
    };

    handlePrev = () => {
        let id = this.state.imageIndex - 1;
        if (id < 0) {
            id = this.props.fileInfos.length - 1;
        }
        this.showImage(id);
    };

    handleKeyPress = (e: KeyboardEvent) => {
        if (Keyboard.isKeyPressed(e, KeyCodes.RIGHT)) {
            this.handleNext();
        } else if (Keyboard.isKeyPressed(e, KeyCodes.LEFT)) {
            this.handlePrev();
        }
    };

    // Separate from handleKeyPress on purpose. File navigation reacts to keyup,
    // but zoom keys have to cancel the browser default, and preventDefault on
    // keyup is too late for that — the character is already in.
    handleZoomKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey || e.altKey) {
            return;
        }

        const fileInfo = this.props.fileInfos[this.state.imageIndex];
        if (!fileInfo) {
            return;
        }

        // PDF shares the zoom state but keeps its own scrolling page view, so the
        // shortcuts stay off there (see spec 012, out of scope).
        const fileType = Utils.getFileType(fileInfo.extension);
        if (fileType !== FileTypes.IMAGE && fileType !== FileTypes.SVG) {
            return;
        }

        const active = document.activeElement as HTMLElement | null;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
            return;
        }

        switch (e.key) {
        case '+':
        case '=':
            this.handleZoomIn();
            break;
        case '-':
            this.handleZoomOut();
            break;
        case '0':
            this.handleZoomReset();
            break;
        default:
            return;
        }

        e.preventDefault();
    };

    componentDidMount() {
        document.addEventListener('keyup', this.handleKeyPress);
        document.addEventListener('keydown', this.handleZoomKeyDown);

        this.showImage(this.props.startIndex);
    }

    componentWillUnmount() {
        document.removeEventListener('keyup', this.handleKeyPress);
        document.removeEventListener('keydown', this.handleZoomKeyDown);
    }

    static getDerivedStateFromProps(props: Props, state: State) {
        const updatedState: Partial<State> = {};
        if (props.fileInfos[state.imageIndex]) {
            const fileInfo = props.fileInfos[state.imageIndex];
            const fileType = Utils.getFileType(fileInfo.extension);
            if (fileType === FileTypes.PDF || fileType === FileTypes.IMAGE || fileType === FileTypes.SVG) {
                updatedState.showZoomControls = true;
            } else {
                updatedState.showZoomControls = false;
            }
        } else {
            updatedState.showZoomControls = false;
        }
        if (props.fileInfos.length !== state.prevFileInfosCount) {
            updatedState.loaded = Utils.fillRecord(false, props.fileInfos.length);
            updatedState.progress = Utils.fillRecord(0, props.fileInfos.length);
            updatedState.prevFileInfosCount = props.fileInfos.length;
        }

        // Zoom and pan reconcile on file identity, not on list length. A post edit
        // can replace the attachment at an index while the length stays the same;
        // reconciling on length alone left the old file's zoom applied to the new one.
        const identities = props.fileInfos.map(FilePreviewModal.getFileIdentity);
        const previous = state.fileIdentities;
        const identityChanged = identities.length !== previous.length ||
            identities.some((identity, index) => previous[index] !== identity);

        if (identityChanged) {
            const scale: Record<number, number> = {};
            const fitScale: Record<number, number> = {};
            const panOffset: Record<number, PanOffset> = {};

            identities.forEach((identity, index) => {
                const unchanged = previous[index] === identity;
                scale[index] = unchanged ? state.scale[index] ?? ZoomSettings.DEFAULT_SCALE : ZoomSettings.DEFAULT_SCALE;
                fitScale[index] = unchanged ? state.fitScale[index] ?? ZoomSettings.DEFAULT_SCALE : ZoomSettings.DEFAULT_SCALE;
                panOffset[index] = unchanged ? state.panOffset[index] ?? ORIGIN : ORIGIN;
            });

            updatedState.scale = scale;
            updatedState.fitScale = fitScale;
            updatedState.panOffset = panOffset;
            updatedState.fileIdentities = identities;
        }

        return Object.keys(updatedState).length ? updatedState : null;
    }

    showImage = (id: number) => {
        this.setState({imageIndex: id});

        const imageHeight = window.innerHeight - 100;
        this.setState({imageHeight});

        if (!this.state.loaded[id]) {
            this.loadImage(id);
        }
    };

    isImageUrl = (url: string): boolean => {
        const fileType = Utils.getFileType(url);
        return fileType === FileTypes.IMAGE || fileType === FileTypes.SVG;
    };

    private getFileTypeFromFileInfo = (fileInfo: FileInfo | LinkInfo): typeof FileTypes[keyof typeof FileTypes] => {
        if (isFileInfo(fileInfo)) {
            return Utils.getFileType(fileInfo.extension);
        }

        if (isLinkInfo(fileInfo)) {
            // if extension is not available or is longer than 5 characters, use the link to determine the file type
            const maxLenghtExtension = 11; // applescript is the longest extension
            const extensionOrLink = fileInfo.extension && fileInfo.extension.length <= maxLenghtExtension ? fileInfo.extension : fileInfo.link;
            return Utils.getFileType(extensionOrLink);
        }

        return FileTypes.OTHER;
    };

    loadImage = (index: number) => {
        const fileInfo = this.props.fileInfos[index];
        if (isFileInfo(fileInfo) && fileInfo.archived) {
            this.handleImageLoaded(index);
            return;
        }

        // Determine file type using helper method
        const fileType = this.getFileTypeFromFileInfo(fileInfo);

        // Check if this is an image
        const isImage = fileType === FileTypes.IMAGE;

        if (isImage) {
            let previewUrl = '';
            if (isFileInfo(fileInfo)) {
                if (fileInfo.has_preview_image) {
                    previewUrl = getFilePreviewUrl(fileInfo.id);
                } else {
                    // some images (eg animated gifs) just show the file itself and not a preview
                    previewUrl = getFileUrl(fileInfo.id);
                }
            } else if (isLinkInfo(fileInfo)) {
                // For LinkInfo, use the link directly
                previewUrl = fileInfo.link;
            }

            Utils.loadImage(
                previewUrl,
                () => this.handleImageLoaded(index),
                (completedPercentage) => this.handleImageProgress(index, completedPercentage),
            );
        } else {
            // there's nothing to load for non-image files
            this.handleImageLoaded(index);
        }
    };

    handleImageLoaded = (index: number) => {
        this.setState((prevState) => {
            const newState = {
                loaded: {
                    ...prevState.loaded,
                    [index]: true,
                },
            };
            return newState;
        });
    };

    handleImageProgress = (index: number, completedPercentage: number) => {
        this.setState((prevState) => {
            return {
                progress: {
                    ...prevState.progress,
                    [index]: completedPercentage,
                },
            };
        });
    };

    onMouseEnterImage = () => {
        this.setState({showCloseBtn: true});
    };

    onMouseLeaveImage = () => {
        this.setState({showCloseBtn: false});
    };

    setScale = (index: number, scale: number) => {
        this.setState((prevState) => {
            return {
                scale: {
                    ...prevState.scale,
                    [index]: scale,
                },
            };
        });
    };

    setPanOffset = (index: number, offset: PanOffset) => {
        this.setState((prevState) => {
            return {
                panOffset: {
                    ...prevState.panOffset,
                    [index]: offset,
                },
            };
        });
    };

    handleZoomIn = () => {
        let newScale = this.state.scale[this.state.imageIndex];
        newScale = Math.min(newScale + ZoomSettings.SCALE_DELTA, ZoomSettings.MAX_SCALE);
        this.setScale(this.state.imageIndex, newScale);
    };

    handleZoomOut = () => {
        let newScale = this.state.scale[this.state.imageIndex];
        newScale = Math.max(newScale - ZoomSettings.SCALE_DELTA, ZoomSettings.MIN_SCALE);
        this.setScale(this.state.imageIndex, newScale);
    };

    handleZoomReset = () => {
        const resetScale = this.state.fitScale[this.state.imageIndex] ?? ZoomSettings.DEFAULT_SCALE;
        this.setScale(this.state.imageIndex, resetScale);
        this.setPanOffset(this.state.imageIndex, ORIGIN);
    };

    // Applies a scale and re-clips the pan offset to whatever room the new size
    // leaves. Shrinking the image below the viewport leaves nowhere to pan, so the
    // offset collapses back to the origin.
    applyZoom = (index: number, nextScale: number, scaledSize: {width: number; height: number}, viewport: {width: number; height: number}, nextOffset?: PanOffset) => {
        const maxX = Math.max(0, scaledSize.width - viewport.width);
        const maxY = Math.max(0, scaledSize.height - viewport.height);

        this.setState((prevState) => {
            const current = nextOffset ?? prevState.panOffset[index] ?? ORIGIN;
            return {
                scale: {
                    ...prevState.scale,
                    [index]: nextScale,
                },
                panOffset: {
                    ...prevState.panOffset,
                    [index]: {
                        x: Math.min(Math.max(current.x, 0), maxX),
                        y: Math.min(Math.max(current.y, 0), maxY),
                    },
                },
            };
        });
    };

    // Zoom anchored on the pointer: the image point under the cursor has to stay
    // under the cursor. Everything needed is already known — the natural size and
    // both ratios — so the new scroll target is computed rather than read back
    // from the DOM, which would force a synchronous layout on every wheel tick.
    handleWheelZoom = (scaleDelta: number, cursor: PanOffset, viewport: {width: number; height: number}, naturalSize: {width: number; height: number}) => {
        const index = this.state.imageIndex;
        const currentScale = this.state.scale[index] ?? ZoomSettings.DEFAULT_SCALE;
        const nextScale = Math.min(
            Math.max(currentScale + scaleDelta, ZoomSettings.MIN_SCALE),
            ZoomSettings.MAX_SCALE,
        );

        if (nextScale === currentScale) {
            return;
        }

        const currentRatio = currentScale / ZoomSettings.DEFAULT_SCALE;
        const nextRatio = nextScale / ZoomSettings.DEFAULT_SCALE;
        const growth = nextRatio / currentRatio;
        const offset = this.state.panOffset[index] ?? ORIGIN;

        const nextOffset = {
            x: ((offset.x + cursor.x) * growth) - cursor.x,
            y: ((offset.y + cursor.y) * growth) - cursor.y,
        };
        const scaledSize = {
            width: naturalSize.width * nextRatio,
            height: naturalSize.height * nextRatio,
        };

        this.applyZoom(index, nextScale, scaledSize, viewport, nextOffset);
    };

    handleAutoScale = (index: number, nextScale: number) => {
        this.setState((prevState) => {
            const currentScale = prevState.scale[index];
            const shouldApply = Math.abs(currentScale - ZoomSettings.DEFAULT_SCALE) < 0.001;
            return {
                scale: {
                    ...prevState.scale,
                    [index]: shouldApply ? nextScale : currentScale,
                },
                fitScale: {
                    ...prevState.fitScale,
                    [index]: nextScale,
                },
            };
        });
    };

    handleModalClose = () => {
        this.setState({show: false});
    };

    getContent = (content: string) => {
        this.setState({content});
    };

    handleBgClose = (e: React.MouseEvent) => {
        if (e.currentTarget === e.target) {
            this.handleModalClose();
        }
    };

    render() {
        if (this.props.fileInfos.length < 1 || this.props.fileInfos.length - 1 < this.state.imageIndex) {
            return null;
        }

        const fileInfo = this.props.fileInfos[this.state.imageIndex];

        // Determine file type using helper method
        const fileType = this.getFileTypeFromFileInfo(fileInfo);

        let showPublicLink;
        let fileName;
        let fileUrl;
        let fileDownloadUrl;
        let isExternalFile;
        let canCopyContent = false;
        if (isFileInfo(fileInfo)) {
            showPublicLink = true;
            fileName = fileInfo.name;
            fileUrl = getFileUrl(fileInfo.id);
            fileDownloadUrl = getFileDownloadUrl(fileInfo.id);
            isExternalFile = false;
        } else {
            showPublicLink = false;
            fileName = fileInfo.name || fileInfo.link;
            fileUrl = fileInfo.link;
            fileDownloadUrl = fileInfo.link;
            isExternalFile = true;
        }

        let dialogClassName = 'a11y__modal modal-image file-preview-modal';

        let content;
        let zoomBar;

        if (isFileInfo(fileInfo) && fileInfo.archived) {
            content = (
                <ArchivedPreview
                    fileInfo={fileInfo}
                />
            );
        }

        if (!isFileInfo(fileInfo) || !fileInfo.archived) {
            if (this.state.loaded[this.state.imageIndex]) {
                if (fileType === FileTypes.IMAGE || fileType === FileTypes.SVG) {
                    content = (
                        <ImagePreview
                            fileInfo={fileInfo as FileInfo}
                            canDownloadFiles={this.props.canDownloadFiles}
                            scale={this.state.scale[this.state.imageIndex]}
                            fitScale={this.state.fitScale[this.state.imageIndex]}
                            panOffset={this.state.panOffset[this.state.imageIndex]}
                            onAutoScale={(nextScale) => this.handleAutoScale(this.state.imageIndex, nextScale)}
                            onBackgroundClick={this.handleBgClose}
                            onPanChange={(offset) => this.setPanOffset(this.state.imageIndex, offset)}
                            onWheelZoom={this.handleWheelZoom}
                        />
                    );
                    zoomBar = (
                        <PopoverBar
                            scale={this.state.scale[this.state.imageIndex]}
                            showZoomControls={this.state.showZoomControls}
                            handleZoomIn={this.handleZoomIn}
                            handleZoomOut={this.handleZoomOut}
                            handleZoomReset={this.handleZoomReset}
                        />
                    );
                } else if (fileType === FileTypes.VIDEO || fileType === FileTypes.AUDIO) {
                    content = (
                        <AudioVideoPreview
                            fileInfo={fileInfo as FileInfo}
                            fileUrl={fileUrl}
                        />
                    );
                } else if (fileType === FileTypes.PDF) {
                    content = (
                        <div
                            className='file-preview-modal__scrollable'
                            onClick={this.handleBgClose}
                        >
                            <React.Suspense fallback={null}>
                                <PDFPreview
                                    fileInfo={fileInfo as FileInfo}
                                    fileUrl={fileUrl}
                                    scale={this.state.scale[this.state.imageIndex]}
                                    handleBgClose={this.handleBgClose}
                                />
                            </React.Suspense>
                        </div>
                    );
                    zoomBar = (
                        <PopoverBar
                            scale={this.state.scale[this.state.imageIndex]}
                            showZoomControls={this.state.showZoomControls}
                            handleZoomIn={this.handleZoomIn}
                            handleZoomOut={this.handleZoomOut}
                            handleZoomReset={this.handleZoomReset}
                        />
                    );
                } else if (hasSupportedLanguage(fileInfo)) {
                    dialogClassName += ' modal-code';
                    canCopyContent = true;
                    content = (
                        <CodePreview
                            fileInfo={fileInfo as FileInfo}
                            fileUrl={fileUrl}
                            getContent={this.getContent}
                        />
                    );
                } else {
                    content = (
                        <FileInfoPreview
                            fileInfo={fileInfo as FileInfo}
                            fileUrl={fileUrl}
                        />
                    );
                }
            } else {
                // display a progress indicator when the preview for an image is still loading
                const progress = Math.floor(this.state.progress[this.state.imageIndex]);

                content = (
                    <LoadingImagePreview
                        loading={
                            <FormattedMessage
                                id='view_image.loading'
                                defaultMessage='Loading'
                            />
                        }
                        progress={progress}
                    />
                );
            }
        }

        if (isFileInfo(fileInfo) && !fileInfo.archived) {
            for (const preview of this.props.pluginFilePreviewComponents) {
                if (preview.override(fileInfo, this.props.post)) {
                    content = (
                        <preview.component
                            fileInfo={fileInfo}
                            post={this.props.post}
                            onModalDismissed={this.handleModalClose}
                        />
                    );
                    break;
                }
            }
        }

        return (
            <Modal
                show={this.state.show}
                onHide={this.handleModalClose}
                onExited={this.props.onExited}
                className='modal-image file-preview-modal'
                dialogClassName={dialogClassName}
                animation={true}
                backdrop={false}
                role='none'
                style={{paddingLeft: 0}}
                aria-labelledby='viewImageModalLabel'
            >
                <Modal.Body className='file-preview-modal__body'>
                    <div
                        className={'modal-image__wrapper'}
                        onClick={this.handleModalClose}
                    >
                        <div
                            className='file-preview-modal__main-ctr'
                            onMouseEnter={this.onMouseEnterImage}
                            onMouseLeave={this.onMouseLeaveImage}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Modal.Title
                                componentClass='div'
                                id='viewImageModalLabel'
                                className='file-preview-modal__title'
                            >
                                <FilePreviewModalHeader
                                    isMobileView={this.props.isMobileView}
                                    post={this.props.post!}
                                    showPublicLink={showPublicLink}
                                    fileIndex={this.state.imageIndex}
                                    totalFiles={this.props.fileInfos?.length}
                                    filename={fileName}
                                    fileURL={fileDownloadUrl}
                                    fileInfo={fileInfo}
                                    enablePublicLink={this.props.enablePublicLink}
                                    canDownloadFiles={this.props.canDownloadFiles}
                                    canCopyContent={canCopyContent}
                                    isExternalFile={isExternalFile}
                                    handlePrev={this.handlePrev}
                                    handleNext={this.handleNext}
                                    handleModalClose={this.handleModalClose}
                                    content={this.state.content}
                                />
                                {zoomBar}
                            </Modal.Title>
                            <div
                                className={classNames(
                                    'file-preview-modal__content',
                                    {
                                        'file-preview-modal__content-scrollable': (!isFileInfo(fileInfo) || !fileInfo.archived) && this.state.loaded[this.state.imageIndex] && (fileType === FileTypes.PDF),
                                    },
                                )}
                                onClick={this.handleBgClose}
                            >
                                {content}
                            </div>
                            { this.props.isMobileView &&
                                <FilePreviewModalFooter
                                    post={this.props.post}
                                    showPublicLink={showPublicLink}
                                    filename={fileName}
                                    fileURL={fileDownloadUrl}
                                    fileInfo={fileInfo}
                                    enablePublicLink={this.props.enablePublicLink}
                                    canDownloadFiles={this.props.canDownloadFiles}
                                    canCopyContent={canCopyContent}
                                    isExternalFile={isExternalFile}
                                    handleModalClose={this.handleModalClose}
                                    content={this.state.content}
                                />
                            }
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        );
    }
}
