// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import ImagePreview from 'components/file_preview_modal/image_preview';

import {fireEvent, render, screen} from 'tests/react_testing_utils';
import {ZoomSettings} from 'utils/constants';
import {TestHelper} from 'utils/test_helper';

describe('components/view_image/ImagePreview', () => {
    const fileInfo1 = TestHelper.getFileInfoMock({id: 'file_id', extension: 'm4a', has_preview_image: false});
    const baseProps = {
        canDownloadFiles: true,
        fileInfo: fileInfo1,
    };

    test('should match snapshot, without preview', () => {
        const {container} = render(
            <ImagePreview {...baseProps}/>,
        );

        expect(container).toMatchSnapshot();
    });

    test('should match snapshot, with preview', () => {
        const props = {
            ...baseProps,
            fileInfo: {
                ...fileInfo1,
                id: 'file_id_1',
                has_preview_image: true,
            },
        };

        const {container} = render(
            <ImagePreview {...props}/>,
        );

        expect(container).toMatchSnapshot();
    });

    test('should match snapshot, without preview, cannot download', () => {
        const props = {
            ...baseProps,
            canDownloadFiles: false,
        };

        const {container} = render(
            <ImagePreview {...props}/>,
        );

        expect(container).toMatchSnapshot();
    });

    test('should match snapshot, with preview, cannot download', () => {
        const props = {
            ...baseProps,
            canDownloadFiles: false,
            fileInfo: {
                ...fileInfo1,
                id: 'file_id_1',
                has_preview_image: true,
            },
        };

        const {container} = render(
            <ImagePreview {...props}/>,
        );

        expect(container).toMatchSnapshot();
    });

    test('should not download link for external file', () => {
        fileInfo1.link = 'https://example.com/image.png';
        const props = {
            ...baseProps,
            fileInfo: {
                ...fileInfo1,
                link: 'https://example.com/image.png',
                id: '',
            },
        };

        render(
            <ImagePreview {...props}/>,
        );

        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(screen.getByTestId('imagePreview')).toHaveAttribute('src', props.fileInfo.link);
    });

    describe('zoom and pan interaction', () => {
        const imageFile = TestHelper.getFileInfoMock({id: 'zoom_file', extension: 'png', has_preview_image: true});

        // The component batches wheel handling into an animation frame. Run frames
        // synchronously so each dispatched event is observable on its own; the
        // batching itself is a rendering concern, checked in the performance pass.
        let rafSpy: jest.SpyInstance;
        beforeEach(() => {
            rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
                cb(0);
                return 0;
            });
        });
        afterEach(() => {
            rafSpy.mockRestore();
        });

        // jsdom does no layout, so natural size and client box have to be stubbed
        // before the load event or every geometry calculation reads zero.
        const stub = (el: Element, values: Record<string, number>) => {
            for (const [name, value] of Object.entries(values)) {
                Object.defineProperty(el, name, {value, configurable: true});
            }
        };

        const renderZoomable = (props: Record<string, unknown> = {}) => {
            const onAutoScale = jest.fn();
            const onBackgroundClick = jest.fn();
            const onPanChange = jest.fn();
            const onWheelZoom = jest.fn();

            const utils = render(
                <ImagePreview
                    canDownloadFiles={true}
                    fileInfo={imageFile}
                    scale={ZoomSettings.DEFAULT_SCALE}
                    fitScale={ZoomSettings.DEFAULT_SCALE}
                    onAutoScale={onAutoScale}
                    onBackgroundClick={onBackgroundClick}
                    onPanChange={onPanChange}
                    onWheelZoom={onWheelZoom}
                    {...props}
                />,
            );

            const image = screen.getByTestId('imagePreview');
            const container = image.parentElement as HTMLElement;

            // Make scroll offsets observable; jsdom keeps them pinned at 0 otherwise.
            let scrollLeft = 0;
            let scrollTop = 0;
            Object.defineProperty(container, 'scrollLeft', {
                get: () => scrollLeft,
                set: (v: number) => {
                    scrollLeft = v;
                },
                configurable: true,
            });
            Object.defineProperty(container, 'scrollTop', {
                get: () => scrollTop,
                set: (v: number) => {
                    scrollTop = v;
                },
                configurable: true,
            });

            return {...utils, image, container, onAutoScale, onBackgroundClick, onPanChange, onWheelZoom};
        };

        const load = (image: HTMLElement, container: HTMLElement, natural = {w: 2000, h: 1000}, client = {w: 400, h: 300}) => {
            stub(image, {naturalWidth: natural.w, naturalHeight: natural.h});
            stub(container, {clientWidth: client.w, clientHeight: client.h});
            fireEvent.load(image);
        };

        test('reports the fit scale when the image is larger than its container', () => {
            const {image, container, onAutoScale} = renderZoomable();

            load(image, container, {w: 2000, h: 1000}, {w: 400, h: 300});

            // min(400/2000, 300/1000, 1) = 0.2 → 1.75 * 0.2
            expect(onAutoScale).toHaveBeenCalledWith(ZoomSettings.DEFAULT_SCALE * 0.2);
        });

        test('keeps the default scale when the image already fits', () => {
            const {image, container, onAutoScale} = renderZoomable();

            load(image, container, {w: 100, h: 100}, {w: 400, h: 300});

            expect(onAutoScale).not.toHaveBeenCalled();
        });

        test('does not pan while the image is at its fit scale', () => {
            const {image, container} = renderZoomable();
            load(image, container);

            fireEvent.mouseDown(container, {button: 0, clientX: 100, clientY: 100});
            fireEvent.mouseMove(document, {clientX: 40, clientY: 30});
            fireEvent.mouseUp(document);

            expect(container.scrollLeft).toBe(0);
            expect(container.scrollTop).toBe(0);
        });

        test('pans the image when zoomed past the fit scale', () => {
            const {image, container} = renderZoomable({scale: 2.75, fitScale: ZoomSettings.DEFAULT_SCALE});
            load(image, container);

            fireEvent.mouseDown(container, {button: 0, clientX: 100, clientY: 100});
            fireEvent.mouseMove(document, {clientX: 70, clientY: 80});

            // Dragging left by 30px scrolls right by 30px.
            expect(container.scrollLeft).toBe(30);
            expect(container.scrollTop).toBe(20);
        });

        test('ignores mousedown from buttons other than the left one', () => {
            const {image, container} = renderZoomable({scale: 2.75, fitScale: ZoomSettings.DEFAULT_SCALE});
            load(image, container);

            fireEvent.mouseDown(container, {button: 2, clientX: 100, clientY: 100});
            fireEvent.mouseMove(document, {clientX: 40, clientY: 30});

            expect(container.scrollLeft).toBe(0);
        });

        test('suppresses the background close click after a drag', () => {
            const {image, container, onBackgroundClick} = renderZoomable({scale: 2.75, fitScale: ZoomSettings.DEFAULT_SCALE});
            load(image, container);

            fireEvent.mouseDown(container, {button: 0, clientX: 100, clientY: 100});
            fireEvent.mouseMove(document, {clientX: 130, clientY: 100});
            fireEvent.mouseUp(document);
            fireEvent.click(container);

            expect(onBackgroundClick).not.toHaveBeenCalled();
        });

        test('still closes on a background click that barely moved', () => {
            const {image, container, onBackgroundClick} = renderZoomable({scale: 2.75, fitScale: ZoomSettings.DEFAULT_SCALE});
            load(image, container);

            fireEvent.mouseDown(container, {button: 0, clientX: 100, clientY: 100});
            fireEvent.mouseMove(document, {clientX: 102, clientY: 100});
            fireEvent.mouseUp(document);
            fireEvent.click(container);

            expect(onBackgroundClick).toHaveBeenCalledTimes(1);
        });

        test('commits the pan offset once when the drag ends', () => {
            const {image, container, onPanChange} = renderZoomable({scale: 2.75, fitScale: ZoomSettings.DEFAULT_SCALE});
            load(image, container);

            fireEvent.mouseDown(container, {button: 0, clientX: 100, clientY: 100});
            fireEvent.mouseMove(document, {clientX: 90, clientY: 90});
            fireEvent.mouseMove(document, {clientX: 70, clientY: 80});
            fireEvent.mouseUp(document);

            expect(onPanChange).toHaveBeenCalledTimes(1);
            expect(onPanChange).toHaveBeenCalledWith({x: 30, y: 20});
        });

        test('ignores a wheel event with no vertical delta', () => {
            const {image, container, onWheelZoom} = renderZoomable();
            load(image, container);

            fireEvent.wheel(container, {deltaY: 0, clientX: 200, clientY: 150});

            expect(onWheelZoom).not.toHaveBeenCalled();
        });

        test('scales the zoom step with the wheel delta magnitude', () => {
            const {image, container, onWheelZoom} = renderZoomable();
            load(image, container);

            fireEvent.wheel(container, {deltaY: -50, clientX: 200, clientY: 150});
            fireEvent.wheel(container, {deltaY: -200, clientX: 200, clientY: 150});

            const [small] = onWheelZoom.mock.calls[0];
            const [large] = onWheelZoom.mock.calls[1];

            expect(small).toBeGreaterThan(0);
            expect(Math.abs(large)).toBeGreaterThan(Math.abs(small));
        });

        test('zooms out on a downward wheel and reports cursor and viewport', () => {
            const {image, container, onWheelZoom} = renderZoomable();
            load(image, container);

            container.getBoundingClientRect = () => ({left: 10, top: 20, width: 400, height: 300} as DOMRect);
            fireEvent.wheel(container, {deltaY: 100, clientX: 210, clientY: 170});

            const [delta, cursor, viewport] = onWheelZoom.mock.calls[0];
            expect(delta).toBeLessThan(0);
            expect(cursor).toEqual({x: 200, y: 150});
            expect(viewport).toEqual({width: 400, height: 300});
        });
    });
});
