// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useRef, useLayoutEffect, useEffect, useState, useCallback} from 'react';

import type {FileInfo} from '@mattermost/types/files';

import {getFilePreviewUrl, getFileDownloadUrl} from 'mattermost-redux/utils/file_utils';

import {FileTypes, ZoomSettings} from 'utils/constants';
import {getFileType} from 'utils/utils';

import './image_preview.scss';

// How far the pointer may travel between mousedown and mouseup and still count as
// a click. Below this the background-close click must still fire; above it the
// gesture was a pan and the click has to be swallowed.
const DRAG_CLICK_THRESHOLD_PX = 5;

// Wheel steps scale with how hard the wheel or trackpad was pushed, bounded so a
// flick can't jump the whole zoom range and a nudge still registers.
const WHEEL_STEP_MIN = 0.5;
const WHEEL_STEP_MAX = 4;
const WHEEL_STEP_DIVISOR = 100;

type PanOffset = {x: number; y: number};

interface Props {
    fileInfo: FileInfo;
    canDownloadFiles: boolean;
    scale?: number;
    fitScale?: number;
    panOffset?: PanOffset;
    onAutoScale?: (nextScale: number) => void;
    onBackgroundClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onPanChange?: (offset: PanOffset) => void;
    onWheelZoom?: (scaleDelta: number, cursor: PanOffset, viewport: {width: number; height: number}, naturalSize: {width: number; height: number}) => void;
}

export default function ImagePreview({
    fileInfo,
    canDownloadFiles,
    scale = ZoomSettings.DEFAULT_SCALE,
    fitScale,
    panOffset,
    onAutoScale,
    onBackgroundClick,
    onPanChange,
    onWheelZoom,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [baseSize, setBaseSize] = useState({width: 0, height: 0});
    const [isDragging, setIsDragging] = useState(false);
    const isExternalFile = !fileInfo.id;

    let fileUrl;
    let previewUrl;
    if (isExternalFile) {
        fileUrl = fileInfo.link;
        previewUrl = fileInfo.link;
    } else {
        fileUrl = getFileDownloadUrl(fileInfo.id);
        previewUrl = fileInfo.has_preview_image ? getFilePreviewUrl(fileInfo.id) : fileUrl;
    }

    // 기본 scale(1.75)을 기준으로 실제 확대 비율 계산
    const zoomRatio = scale / ZoomSettings.DEFAULT_SCALE;
    const restScale = fitScale ?? ZoomSettings.DEFAULT_SCALE;
    const canPan = scale > restScale;

    // 이미지 로드 후 기본 크기 저장
    const handleImageLoad = useCallback(() => {
        if (!imageRef.current) {
            return;
        }

        const width = imageRef.current.naturalWidth || imageRef.current.offsetWidth;
        const height = imageRef.current.naturalHeight || imageRef.current.offsetHeight;
        setBaseSize({width, height});

        const container = containerRef.current;
        if (!container || !width || !height) {
            return;
        }

        const widthRatio = container.clientWidth / width;
        const heightRatio = container.clientHeight / height;
        const fitRatio = Math.min(widthRatio, heightRatio, 1);
        const nextFitScale = ZoomSettings.DEFAULT_SCALE * fitRatio;
        if (onAutoScale && Math.abs(nextFitScale - scale) > 0.001) {
            onAutoScale(nextFitScale);
        }
    }, [onAutoScale, scale]);

    useEffect(() => {
        setBaseSize({width: 0, height: 0});
    }, [previewUrl]);

    const scaledWidth = baseSize.width * zoomRatio;
    const scaledHeight = baseSize.height * zoomRatio;
    const containerWidth = containerRef.current?.clientWidth ?? 0;
    const containerHeight = containerRef.current?.clientHeight ?? 0;
    const hasHorizontalOverflow = baseSize.width > 0 && scaledWidth > containerWidth;
    const hasVerticalOverflow = baseSize.height > 0 && scaledHeight > containerHeight;
    const shouldEnableScroll = Boolean(containerWidth && containerHeight && (hasHorizontalOverflow || hasVerticalOverflow));
    const containerStyle: React.CSSProperties = {
        justifyContent: hasHorizontalOverflow ? 'flex-start' : 'center',
        alignItems: hasVerticalOverflow ? 'flex-start' : 'center',
    };

    // 이동 위치는 부모가 파일별로 들고 있다. 감싸는 요소는 파일을 넘겨도 같은
    // 노드라, 렌더 뒤에 저장된 위치로 되돌려 놓아야 파일별 위치가 유지된다.
    const offsetX = panOffset?.x ?? 0;
    const offsetY = panOffset?.y ?? 0;
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return undefined;
        }

        const rafId = requestAnimationFrame(() => {
            container.scrollLeft = offsetX;
            container.scrollTop = offsetY;
        });
        return () => cancelAnimationFrame(rafId);
    }, [offsetX, offsetY, scale, baseSize]);

    // 끌기 상태는 ref에 둔다. 마우스가 움직일 때마다 상태를 바꾸면 프레임마다
    // 재렌더가 걸려 커서에서 이미지가 밀린다.
    // The wheel handler is bound once via a native listener, so it can't close
    // over the latest natural size. Keep it in a ref the load handler updates.
    const naturalRef = useRef({width: 0, height: 0});
    naturalRef.current = baseSize;

    const drag = useRef({
        active: false,
        moved: false,
        startX: 0,
        startY: 0,
        startScrollLeft: 0,
        startScrollTop: 0,
    });

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container || e.button !== 0 || !canPan) {
            return;
        }

        drag.current = {
            active: true,
            moved: false,
            startX: e.clientX,
            startY: e.clientY,
            startScrollLeft: container.scrollLeft,
            startScrollTop: container.scrollTop,
        };
        setIsDragging(true);
    }, [canPan]);

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            const container = containerRef.current;
            if (!drag.current.active || !container) {
                return;
            }

            const dx = e.clientX - drag.current.startX;
            const dy = e.clientY - drag.current.startY;
            if (Math.abs(dx) > DRAG_CLICK_THRESHOLD_PX || Math.abs(dy) > DRAG_CLICK_THRESHOLD_PX) {
                drag.current.moved = true;
            }

            container.scrollLeft = drag.current.startScrollLeft - dx;
            container.scrollTop = drag.current.startScrollTop - dy;
        };

        const handleUp = () => {
            const container = containerRef.current;
            if (!drag.current.active) {
                return;
            }

            drag.current.active = false;
            setIsDragging(false);

            if (container && drag.current.moved && onPanChange) {
                onPanChange({x: container.scrollLeft, y: container.scrollTop});
            }
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
        return () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
        };
    }, [onPanChange]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // A pan that ends over the background would otherwise read as a
        // background click and close the modal mid-gesture.
        if (drag.current.moved) {
            drag.current.moved = false;
            return;
        }
        onBackgroundClick?.(e);
    }, [onBackgroundClick]);

    // React's wheel events are passive, so preventDefault() there is a no-op and
    // the page scrolls behind the preview. Bind a native non-passive listener and
    // batch to one call per frame so a fast wheel can't outrun rendering.
    const wheelPending = useRef({delta: 0, cursor: {x: 0, y: 0}, viewport: {width: 0, height: 0}});
    const wheelScheduled = useRef(false);
    const wheelFrame = useRef<number | null>(null);
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !onWheelZoom) {
            return undefined;
        }

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (e.deltaY === 0) {
                return;
            }

            const box = container.getBoundingClientRect();
            wheelPending.current.delta += e.deltaY;
            wheelPending.current.cursor = {x: e.clientX - box.left, y: e.clientY - box.top};
            wheelPending.current.viewport = {width: container.clientWidth, height: container.clientHeight};

            // The flag flips before scheduling, never from the frame id, so the
            // guard holds no matter when the callback runs relative to this line.
            if (wheelScheduled.current) {
                return;
            }
            wheelScheduled.current = true;

            wheelFrame.current = requestAnimationFrame(() => {
                wheelScheduled.current = false;
                wheelFrame.current = null;

                const {delta, cursor, viewport} = wheelPending.current;
                wheelPending.current.delta = 0;
                if (delta === 0) {
                    return;
                }

                const magnitude = Math.min(
                    WHEEL_STEP_MAX,
                    Math.max(WHEEL_STEP_MIN, Math.abs(delta) / WHEEL_STEP_DIVISOR),
                );
                const step = ZoomSettings.SCALE_DELTA * magnitude;
                onWheelZoom(delta < 0 ? step : -step, cursor, viewport, naturalRef.current);
            });
        };

        container.addEventListener('wheel', handleWheel, {passive: false});
        return () => {
            container.removeEventListener('wheel', handleWheel);
            if (wheelFrame.current !== null) {
                cancelAnimationFrame(wheelFrame.current);
                wheelFrame.current = null;
            }
            wheelScheduled.current = false;
        };
    }, [onWheelZoom]);

    if (!canDownloadFiles) {
        return <img src={previewUrl}/>;
    }

    const isSVG = getFileType(fileInfo.extension) === FileTypes.SVG;

    let imageStyle: React.CSSProperties = {};

    if (isSVG) {
        imageStyle.width = fileInfo.width;
        imageStyle.height = 'auto';
    }

    // 확대 시 실제 크기 변경 (transform 대신)
    if (baseSize.width > 0 && scale !== ZoomSettings.DEFAULT_SCALE) {
        imageStyle = {
            ...imageStyle,
            width: scaledWidth,
            height: scaledHeight,
            maxWidth: 'none',
            maxHeight: 'none',
        };
    }

    const classes = ['image_preview'];
    if (shouldEnableScroll) {
        classes.push('image_preview--zoomed');
    }
    if (canPan) {
        classes.push('image_preview--pannable');
    }
    if (isDragging) {
        classes.push('image_preview--dragging');
    }

    return (
        <div
            ref={containerRef}
            className={classes.join(' ')}
            style={containerStyle}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
        >
            <img
                ref={imageRef}
                className='image_preview__image'
                loading='lazy'
                data-testid='imagePreview'
                alt={'preview url image'}
                src={previewUrl}
                style={imageStyle}
                onLoad={handleImageLoad}
            />
        </div>
    );
}
