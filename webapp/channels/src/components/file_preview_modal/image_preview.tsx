// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useRef, useLayoutEffect, useEffect, useState, useCallback} from 'react';

import type {FileInfo} from '@mattermost/types/files';

import {getFilePreviewUrl, getFileDownloadUrl} from 'mattermost-redux/utils/file_utils';

import {FileTypes, ZoomSettings} from 'utils/constants';
import {getFileType} from 'utils/utils';

import './image_preview.scss';

interface Props {
    fileInfo: FileInfo;
    canDownloadFiles: boolean;
    scale?: number;
    onAutoScale?: (nextScale: number) => void;
    onBackgroundClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function ImagePreview({
    fileInfo,
    canDownloadFiles,
    scale = ZoomSettings.DEFAULT_SCALE,
    onAutoScale,
    onBackgroundClick,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [baseSize, setBaseSize] = useState({width: 0, height: 0});
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
        const fitScale = ZoomSettings.DEFAULT_SCALE * fitRatio;
        if (onAutoScale && Math.abs(fitScale - scale) > 0.001) {
            onAutoScale(fitScale);
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

    // 확대 시 스크롤을 중앙으로 이동
    useLayoutEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const container = containerRef.current;
        const centerScroll = () => {
            if (!shouldEnableScroll || scale === ZoomSettings.DEFAULT_SCALE) {
                container.scrollLeft = 0;
                container.scrollTop = 0;
                return;
            }

            const scrollLeft = hasHorizontalOverflow ? (container.scrollWidth - container.clientWidth) / 2 : 0;
            const scrollTop = hasVerticalOverflow ? (container.scrollHeight - container.clientHeight) / 2 : 0;
            container.scrollLeft = Math.max(0, scrollLeft);
            container.scrollTop = Math.max(0, scrollTop);
        };

        const rafId = requestAnimationFrame(centerScroll);
        return () => cancelAnimationFrame(rafId);
    }, [scale, baseSize, shouldEnableScroll]);

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

    return (
        <div
            ref={containerRef}
            className={`image_preview ${shouldEnableScroll ? 'image_preview--zoomed' : ''}`}
            style={containerStyle}
            onClick={onBackgroundClick}
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
