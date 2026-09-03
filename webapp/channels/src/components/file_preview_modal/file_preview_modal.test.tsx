// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import FilePreviewModal from 'components/file_preview_modal/file_preview_modal';

import {act, render} from 'tests/react_testing_utils';
import Constants, {ZoomSettings} from 'utils/constants';
import {TestHelper} from 'utils/test_helper';
import * as Utils from 'utils/utils';
import {generateId} from 'utils/utils';

jest.mock('react-bootstrap', () => {
    const Modal = ({children, show}: {children: React.ReactNode; show: boolean}) => (show ? <div>{children}</div> : null);
    Modal.Header = ({children}: {children: React.ReactNode}) => <div>{children}</div>;
    Modal.Body = ({children}: {children: React.ReactNode}) => <div>{children}</div>;
    Modal.Title = ({children}: {children: React.ReactNode}) => <div>{children}</div>;
    return {Modal};
});

jest.mock('components/archived_preview', () => () => <div>{'Archived Preview'}</div>);
jest.mock('components/audio_video_preview', () => () => <div>{'Audio Video Preview'}</div>);
jest.mock('components/code_preview', () => ({
    __esModule: true,
    default: () => <div>{'Code Preview'}</div>,
    hasSupportedLanguage: () => true,
}));
jest.mock('components/file_info_preview', () => () => <div>{'File Info Preview'}</div>);
jest.mock('components/loading_image_preview', () => () => <div>{'Loading Image Preview'}</div>);
jest.mock('components/pdf_preview', () => ({
    __esModule: true,
    default: () => <div>{'PDF Preview'}</div>,
}));
jest.mock('components/file_preview_modal/file_preview_modal_footer/file_preview_modal_footer', () => () => (
    <div>{'File Preview Modal Footer'}</div>
));
jest.mock('components/file_preview_modal/file_preview_modal_header/file_preview_modal_header', () => () => (
    <div>{'File Preview Modal Header'}</div>
));
jest.mock('components/file_preview_modal/image_preview', () => () => <div>{'Image Preview'}</div>);
jest.mock('components/file_preview_modal/popover_bar', () => () => <div>{'Popover Bar'}</div>);

describe('components/FilePreviewModal', () => {
    const baseProps = {
        fileInfos: [TestHelper.getFileInfoMock({id: 'file_id', extension: 'jpg'})],
        startIndex: 0,
        canDownloadFiles: true,
        enablePublicLink: true,
        isMobileView: false,
        post: TestHelper.getPostMock(),
        onExited: jest.fn(),
    };

    const renderModal = (props = baseProps) => {
        const ref = React.createRef<FilePreviewModal>();
        const utils = render(
            <FilePreviewModal
                ref={ref}
                {...props}
            />,
        );
        return {ref, ...utils};
    };

    test('should match snapshot', () => {
        const {container} = renderModal();
        expect(container).toMatchSnapshot();
    });

    test('should match snapshot, loaded with image', () => {
        const {container, ref} = renderModal();
        act(() => {
            ref.current?.setState({loaded: [true] as any});
        });
        expect(container).toMatchSnapshot();
    });

    test('should match snapshot, loaded with .mov file', () => {
        const fileInfos = [TestHelper.getFileInfoMock({id: 'file_id', extension: 'mov'})];
        const props = {...baseProps, fileInfos};
        const {container, ref} = renderModal(props);
        act(() => {
            ref.current?.setState({loaded: [true] as any});
        });
        expect(container).toMatchSnapshot();
    });

    test('should match snapshot, loaded with .m4a file', () => {
        const fileInfos = [TestHelper.getFileInfoMock({id: 'file_id', extension: 'm4a'})];
        const props = {...baseProps, fileInfos};
        const {container, ref} = renderModal(props);
        act(() => {
            ref.current?.setState({loaded: [true] as any});
        });
        expect(container).toMatchSnapshot();
    });

    test('should match snapshot, loaded with .js file', () => {
        const fileInfos = [TestHelper.getFileInfoMock({id: 'file_id', extension: 'js'})];
        const props = {...baseProps, fileInfos};
        const {container, ref} = renderModal(props);
        act(() => {
            ref.current?.setState({loaded: [true] as any});
        });
        expect(container).toMatchSnapshot();
    });

    test('should match snapshot, loaded with other file', () => {
        const fileInfos = [TestHelper.getFileInfoMock({id: 'file_id', extension: 'other'})];
        const props = {...baseProps, fileInfos};
        const {container, ref} = renderModal(props);
        act(() => {
            ref.current?.setState({loaded: [true] as any});
        });
        expect(container).toMatchSnapshot();
    });

    test('should match snapshot, loaded with footer', () => {
        const fileInfos = [
            TestHelper.getFileInfoMock({id: 'file_id_1', extension: 'gif'}),
            TestHelper.getFileInfoMock({id: 'file_id_2', extension: 'wma'}),
            TestHelper.getFileInfoMock({id: 'file_id_3', extension: 'mp4'}),
        ];
        const props = {...baseProps, fileInfos};
        const {container, ref} = renderModal(props);
        act(() => {
            ref.current?.setState({loaded: [true, true, true] as any});
        });
        expect(container).toMatchSnapshot();
    });

    test('should match snapshot, loaded', () => {
        const {container, ref} = renderModal();
        act(() => {
            ref.current?.setState({loaded: [true] as any});
        });
        expect(container).toMatchSnapshot();
    });

    test('should match snapshot, loaded and showing footer', () => {
        const {container, ref} = renderModal();
        act(() => {
            ref.current?.setState({loaded: [true] as any});
        });
        expect(container).toMatchSnapshot();
    });

    test('should go to next or previous upon key press of right or left, respectively', () => {
        const fileInfos = [
            TestHelper.getFileInfoMock({id: 'file_id_1', extension: 'gif'}),
            TestHelper.getFileInfoMock({id: 'file_id_2', extension: 'wma'}),
            TestHelper.getFileInfoMock({id: 'file_id_3', extension: 'mp4'}),
        ];
        const props = {...baseProps, fileInfos};
        const {ref} = renderModal(props);
        act(() => {
            ref.current?.setState({loaded: [true, true, true] as any});
        });

        let evt = {key: Constants.KeyCodes.RIGHT[0]} as KeyboardEvent;
        act(() => {
            ref.current?.handleKeyPress(evt);
        });
        expect(ref.current?.state.imageIndex).toBe(1);
        act(() => {
            ref.current?.handleKeyPress(evt);
        });
        expect(ref.current?.state.imageIndex).toBe(2);

        evt = {key: Constants.KeyCodes.LEFT[0]} as KeyboardEvent;
        act(() => {
            ref.current?.handleKeyPress(evt);
        });
        expect(ref.current?.state.imageIndex).toBe(1);
        act(() => {
            ref.current?.handleKeyPress(evt);
        });
        expect(ref.current?.state.imageIndex).toBe(0);
    });

    test('should handle onMouseEnter and onMouseLeave', () => {
        const {ref} = renderModal();
        act(() => {
            ref.current?.setState({loaded: [true] as any});
        });

        act(() => {
            ref.current?.onMouseEnterImage();
        });
        expect(ref.current?.state.showCloseBtn).toBe(true);

        act(() => {
            ref.current?.onMouseLeaveImage();
        });
        expect(ref.current?.state.showCloseBtn).toBe(false);
    });

    test('should handle on modal close', () => {
        const {ref} = renderModal();
        act(() => {
            ref.current?.setState({loaded: [true] as any});
        });

        act(() => {
            ref.current?.handleModalClose();
        });
        expect(ref.current?.state.show).toBe(false);
    });

    test('should match snapshot for external file', () => {
        const fileInfos = [
            TestHelper.getFileInfoMock({extension: 'png'}),
        ];
        const props = {...baseProps, fileInfos};
        const {container} = renderModal(props);
        expect(container).toMatchSnapshot();
    });

    test('should correctly identify image URLs with isImageUrl method', () => {
        const {ref} = renderModal();

        // Test proxied image URLs
        expect(ref.current?.isImageUrl('http://localhost:8065/api/v4/image?url=https%3A%2F%2Fexample.com%2Fimage.jpg')).toBe(true);

        // Test URLs with image extensions
        expect(ref.current?.isImageUrl('https://example.com/image.jpg')).toBe(true);
        expect(ref.current?.isImageUrl('https://example.com/image.png')).toBe(true);
        expect(ref.current?.isImageUrl('https://example.com/image.gif')).toBe(true);

        // Test non-image URLs
        expect(ref.current?.isImageUrl('https://example.com/document.pdf')).toBe(false);
        expect(ref.current?.isImageUrl('https://example.com/file.txt')).toBe(false);
    });

    test('should handle external image URLs correctly', () => {
        // Create a mock for Utils.loadImage
        const loadImageSpy = jest.spyOn(Utils, 'loadImage').mockImplementation((url, onLoad) => {
            // Create a mock ProgressEvent
            const mockProgressEvent = new ProgressEvent('progress');

            // Call onLoad with the mock event if it exists
            if (onLoad) {
                onLoad.call({} as XMLHttpRequest, mockProgressEvent);
            }
        });

        // Create a LinkInfo object for an external image URL
        const externalImageUrl = 'http://localhost:8065/api/v4/image?url=https%3A%2F%2Fexample.com%2Fimage.jpg';
        const fileInfos = [
            TestHelper.getFileInfoMock({
                id: '',
                has_preview_image: false,
                link: externalImageUrl,
                extension: '',
                name: 'External Image',
            }),
        ];

        const props = {...baseProps, fileInfos};
        const {ref} = renderModal(props);

        const handleImageLoadedSpy = jest.spyOn(ref.current as FilePreviewModal, 'handleImageLoaded');

        act(() => {
            ref.current?.loadImage(0);
        });

        // Verify that Utils.loadImage was called with the correct URL
        expect(loadImageSpy).toHaveBeenCalledWith(
            externalImageUrl,
            expect.any(Function),
            expect.any(Function),
        );

        // Verify that handleImageLoaded was called
        expect(handleImageLoadedSpy).toHaveBeenCalled();

        // Restore the original loadImage function
        loadImageSpy.mockRestore();
    });

    test('should have called loadImage', () => {
        const fileInfos = [
            TestHelper.getFileInfoMock({id: 'file_id_1', extension: 'gif'}),
            TestHelper.getFileInfoMock({id: 'file_id_2', extension: 'wma'}),
            TestHelper.getFileInfoMock({id: 'file_id_3', extension: 'mp4'}),
        ];
        const props = {...baseProps, fileInfos};
        const {ref} = renderModal(props);

        let index = 1;
        act(() => {
            ref.current?.setState({loaded: [true, false, false] as any});
            ref.current?.loadImage(index);
        });

        expect(ref.current?.state.loaded[index]).toBe(true);

        index = 2;
        act(() => {
            ref.current?.loadImage(index);
        });
        expect(ref.current?.state.loaded[index]).toBe(true);
    });

    test('should handle handleImageLoaded', () => {
        const fileInfos = [
            TestHelper.getFileInfoMock({id: 'file_id_1', extension: 'gif'}),
            TestHelper.getFileInfoMock({id: 'file_id_2', extension: 'wma'}),
            TestHelper.getFileInfoMock({id: 'file_id_3', extension: 'mp4'}),
        ];
        const props = {...baseProps, fileInfos};
        const {ref} = renderModal(props);

        let index = 1;
        act(() => {
            ref.current?.setState({loaded: [true, false, false] as any});
            ref.current?.handleImageLoaded(index);
        });

        expect(ref.current?.state.loaded[index]).toBe(true);

        index = 2;
        act(() => {
            ref.current?.handleImageLoaded(index);
        });
        expect(ref.current?.state.loaded[index]).toBe(true);
    });

    test('should handle handleImageProgress', () => {
        const fileInfos = [
            TestHelper.getFileInfoMock({id: 'file_id_1', extension: 'gif'}),
            TestHelper.getFileInfoMock({id: 'file_id_2', extension: 'wma'}),
            TestHelper.getFileInfoMock({id: 'file_id_3', extension: 'mp4'}),
        ];
        const props = {...baseProps, fileInfos};
        const {ref} = renderModal(props);

        const index = 1;
        let completedPercentage = 30;
        act(() => {
            ref.current?.setState({loaded: [true, false, false] as any});
            ref.current?.handleImageProgress(index, completedPercentage);
        });

        expect(ref.current?.state.progress[index]).toBe(completedPercentage);

        completedPercentage = 70;
        act(() => {
            ref.current?.handleImageProgress(index, completedPercentage);
        });

        expect(ref.current?.state.progress[index]).toBe(completedPercentage);
    });

    test('should pass componentWillReceiveProps', () => {
        const {ref, rerender} = renderModal();

        expect(Object.keys(ref.current?.state.loaded || {})).toHaveLength(1);
        expect(Object.keys(ref.current?.state.progress || {})).toHaveLength(1);

        act(() => {
            rerender(
                <FilePreviewModal
                    {...baseProps}
                    ref={ref}
                    fileInfos={[
                        TestHelper.getFileInfoMock({id: 'file_id_1', extension: 'gif'}),
                        TestHelper.getFileInfoMock({id: 'file_id_2', extension: 'wma'}),
                        TestHelper.getFileInfoMock({id: 'file_id_3', extension: 'mp4'}),
                    ]}
                />,
            );
        });
        expect(Object.keys(ref.current?.state.loaded || {})).toHaveLength(3);
        expect(Object.keys(ref.current?.state.progress || {})).toHaveLength(3);
    });

    test('should match snapshot when plugin overrides the preview component', () => {
        const pluginFilePreviewComponents = [{
            id: generateId(),
            pluginId: 'file-preview',
            override: () => true,
            component: () => <div>{'Preview'}</div>,
        }];
        const props = {...baseProps, pluginFilePreviewComponents};
        const {container} = renderModal(props);
        expect(container).toMatchSnapshot();
    });

    test('should fall back to default preview if plugin does not need to override preview component', () => {
        const pluginFilePreviewComponents = [{
            id: generateId(),
            pluginId: 'file-preview',
            override: () => false,
            component: () => <div>{'Preview'}</div>,
        }];
        const props = {...baseProps, pluginFilePreviewComponents};
        const {container} = renderModal(props);
        expect(container).toMatchSnapshot();
    });

    describe('per-file zoom state', () => {
        test('getFileIdentity namespaces file ids and external links separately', () => {
            const byId = FilePreviewModal.getFileIdentity(TestHelper.getFileInfoMock({id: 'abc'}));
            const byLink = FilePreviewModal.getFileIdentity({
                has_preview_image: false,
                link: 'abc',
                extension: 'png',
                name: 'abc',
            });

            expect(byId).toBe('id:abc');
            expect(byLink).toBe('link:abc');
            expect(byId).not.toBe(byLink);
        });

        test('resets only the swapped index when the file list length is unchanged', () => {
            const {ref, rerender} = renderModal({
                ...baseProps,
                fileInfos: [
                    TestHelper.getFileInfoMock({id: 'file_a', extension: 'jpg'}),
                    TestHelper.getFileInfoMock({id: 'file_b', extension: 'jpg'}),
                ],
            });

            act(() => {
                ref.current?.setScale(0, 2.5);
                ref.current?.setScale(1, 2.25);
                ref.current?.setPanOffset(0, {x: 40, y: 60});
                ref.current?.setPanOffset(1, {x: 10, y: 20});
            });

            // Same length, different file at index 0 — the pre-existing bug let the
            // old file's zoom survive because only length changes triggered a reset.
            act(() => {
                rerender(
                    <FilePreviewModal
                        {...baseProps}
                        ref={ref}
                        fileInfos={[
                            TestHelper.getFileInfoMock({id: 'file_c', extension: 'jpg'}),
                            TestHelper.getFileInfoMock({id: 'file_b', extension: 'jpg'}),
                        ]}
                    />,
                );
            });

            expect(ref.current?.state.scale[0]).toBe(ZoomSettings.DEFAULT_SCALE);
            expect(ref.current?.state.panOffset[0]).toEqual({x: 0, y: 0});

            // The untouched index keeps what the user had set.
            expect(ref.current?.state.scale[1]).toBe(2.25);
            expect(ref.current?.state.panOffset[1]).toEqual({x: 10, y: 20});
        });

        test('seeds newly appended indexes with defaults', () => {
            const {ref, rerender} = renderModal();

            act(() => {
                ref.current?.setScale(0, 2.5);
            });

            act(() => {
                rerender(
                    <FilePreviewModal
                        {...baseProps}
                        ref={ref}
                        fileInfos={[
                            TestHelper.getFileInfoMock({id: 'file_id', extension: 'jpg'}),
                            TestHelper.getFileInfoMock({id: 'file_new', extension: 'jpg'}),
                        ]}
                    />,
                );
            });

            expect(ref.current?.state.scale[1]).toBe(ZoomSettings.DEFAULT_SCALE);
            expect(ref.current?.state.panOffset[1]).toEqual({x: 0, y: 0});
        });

        test('resetting zoom returns to the fit scale and the origin', () => {
            const {ref} = renderModal();

            act(() => {
                ref.current?.handleAutoScale(0, 0.35);
                ref.current?.setScale(0, 2.5);
                ref.current?.setPanOffset(0, {x: 120, y: 80});
            });

            act(() => {
                ref.current?.handleZoomReset();
            });

            expect(ref.current?.state.scale[0]).toBe(0.35);
            expect(ref.current?.state.panOffset[0]).toEqual({x: 0, y: 0});
        });

        test('clamps the pan offset when zooming back to a size that fits', () => {
            const {ref} = renderModal();

            act(() => {
                ref.current?.handleAutoScale(0, ZoomSettings.DEFAULT_SCALE);
                ref.current?.setScale(0, 2.75);
                ref.current?.setPanOffset(0, {x: 200, y: 150});
            });

            act(() => {
                // The scaled image is smaller than the viewport, so there is
                // nowhere left to pan and the offset has to collapse.
                ref.current?.applyZoom(0, ZoomSettings.DEFAULT_SCALE, {width: 200, height: 150}, {width: 400, height: 300});
            });

            expect(ref.current?.state.panOffset[0]).toEqual({x: 0, y: 0});
        });

        test('keeps the cursor anchored while wheel zooming', () => {
            const {ref} = renderModal();

            act(() => {
                ref.current?.handleAutoScale(0, ZoomSettings.DEFAULT_SCALE);
                ref.current?.setPanOffset(0, {x: 100, y: 50});
            });

            // 1.75 -> 2.625 is a growth of 1.5 (staying under the 3.0 ceiling).
            // Cursor sits 200,150 into a 400x300 viewport, so the scroll target is
            //   (100 + 200) * 1.5 - 200 = 250 and (50 + 150) * 1.5 - 150 = 150.
            act(() => {
                ref.current?.handleWheelZoom(0.875, {x: 200, y: 150}, {width: 400, height: 300}, {width: 2000, height: 1000});
            });

            expect(ref.current?.state.scale[0]).toBe(2.625);
            expect(ref.current?.state.panOffset[0]).toEqual({x: 250, y: 150});
        });

        test('clamps the zoom at the configured ceiling and floor', () => {
            const {ref} = renderModal();
            const natural = {width: 2000, height: 1000};
            const viewport = {width: 400, height: 300};

            act(() => {
                ref.current?.handleWheelZoom(99, {x: 0, y: 0}, viewport, natural);
            });
            expect(ref.current?.state.scale[0]).toBe(ZoomSettings.MAX_SCALE);

            act(() => {
                ref.current?.handleWheelZoom(-99, {x: 0, y: 0}, viewport, natural);
            });
            expect(ref.current?.state.scale[0]).toBe(ZoomSettings.MIN_SCALE);
        });

        describe('keyboard zoom', () => {
            const press = (ref: React.RefObject<FilePreviewModal>, key: string, extra: Partial<KeyboardEvent> = {}) => {
                const event = {key, preventDefault: jest.fn(), ...extra} as unknown as KeyboardEvent;
                act(() => {
                    ref.current?.handleZoomKeyDown(event);
                });
                return event;
            };

            test('zooms in on + and =, out on -, and resets on 0', () => {
                const {ref} = renderModal();
                const start = ref.current!.state.scale[0];

                press(ref, '+');
                expect(ref.current?.state.scale[0]).toBe(start + ZoomSettings.SCALE_DELTA);

                press(ref, '=');
                expect(ref.current?.state.scale[0]).toBe(start + (2 * ZoomSettings.SCALE_DELTA));

                press(ref, '-');
                expect(ref.current?.state.scale[0]).toBe(start + ZoomSettings.SCALE_DELTA);

                act(() => {
                    ref.current?.setPanOffset(0, {x: 30, y: 30});
                });
                press(ref, '0');
                expect(ref.current?.state.scale[0]).toBe(start);
                expect(ref.current?.state.panOffset[0]).toEqual({x: 0, y: 0});
            });

            test('ignores keys while a text field has focus', () => {
                const {ref} = renderModal();
                const start = ref.current!.state.scale[0];

                const input = document.createElement('input');
                document.body.appendChild(input);
                input.focus();

                press(ref, '+');
                expect(ref.current?.state.scale[0]).toBe(start);

                input.remove();
            });

            test('ignores keys pressed with a modifier', () => {
                const {ref} = renderModal();
                const start = ref.current!.state.scale[0];

                press(ref, '+', {ctrlKey: true});
                press(ref, '+', {metaKey: true});
                press(ref, '+', {altKey: true});

                expect(ref.current?.state.scale[0]).toBe(start);
            });

            test('does nothing while a pdf is on screen', () => {
                const {ref} = renderModal({
                    ...baseProps,
                    fileInfos: [TestHelper.getFileInfoMock({id: 'doc', extension: 'pdf'})],
                });
                const start = ref.current!.state.scale[0];

                press(ref, '+');

                expect(ref.current?.state.scale[0]).toBe(start);
            });
        });

        test('shows zoom controls for image, svg and pdf only', () => {
            const cases: Array<[string, boolean]> = [
                ['jpg', true],
                ['svg', true],
                ['pdf', true],
                ['mp4', false],
                ['txt', false],
            ];

            for (const [extension, expected] of cases) {
                const {ref, unmount} = renderModal({
                    ...baseProps,
                    fileInfos: [TestHelper.getFileInfoMock({id: `file_${extension}`, extension})],
                });

                expect(ref.current?.state.showZoomControls).toBe(expected);
                unmount();
            }
        });
    });
});
