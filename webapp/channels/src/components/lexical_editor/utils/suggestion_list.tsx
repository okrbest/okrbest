import React, {useEffect, useRef, useState} from 'react';
import classNames from 'classnames';
import './suggestion_list.scss';

export type SuggestionItem = {
    id: string;
    display: string;
    description?: string;
    icon?: React.ReactNode;
    group?: string;
};

type Props = {
    items: SuggestionItem[];
    onSelect: (item: SuggestionItem) => void;
    onClose: () => void;
    loading?: boolean;
    header?: string;
};

export default function SuggestionList({items, onSelect, onClose, loading, header}: Props) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    useEffect(() => {
        setSelectedIndex(0);
    }, [items]);

    // 키보드 이동 시 선택된 아이템으로 스크롤
    useEffect(() => {
        const el = itemRefs.current.get(selectedIndex);
        if (el && listRef.current) {
            el.scrollIntoView({block: 'nearest'});
        }
    }, [selectedIndex]);

    const selectedIndexRef = useRef(0);
    selectedIndexRef.current = selectedIndex;

    const itemsRef = useRef(items);
    itemsRef.current = items;

    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;

    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const currentItems = itemsRef.current;
            if (currentItems.length === 0) {
                return;
            }

            switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                e.stopImmediatePropagation();
                setSelectedIndex((prev) => (prev + 1) % currentItems.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                e.stopImmediatePropagation();
                setSelectedIndex((prev) => (prev - 1 + currentItems.length) % currentItems.length);
                break;
            case 'Enter':
            case 'Tab':
                e.preventDefault();
                e.stopImmediatePropagation();
                if (currentItems[selectedIndexRef.current]) {
                    onSelectRef.current(currentItems[selectedIndexRef.current]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                e.stopImmediatePropagation();
                onCloseRef.current();
                break;
            }
        };

        // capture 단계에서 처리하여 Lexical 커맨드보다 먼저 키 이벤트를 가로챔
        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, []);

    if (items.length === 0 && !loading) {
        return null;
    }

    // 그룹별로 아이템 렌더링 (group 필드가 있는 경우 그룹 헤더 표시)
    let lastGroup: string | undefined;

    return (
        <div ref={listRef} className="lexical-suggestion-list" role="listbox">
            {header && !items.some((item) => item.group) && (
                <div className="suggestion-list__header">{header}</div>
            )}
            {loading && <div className="suggestion-list__loading">{'Loading...'}</div>}
            {items.map((item, index) => {
                const showGroupHeader = item.group && item.group !== lastGroup;
                lastGroup = item.group;

                return (
                    <React.Fragment key={item.id}>
                        {showGroupHeader && (
                            <div className="suggestion-list__group-header">{item.group}</div>
                        )}
                        <div
                            ref={(el) => {
                                if (el) {
                                    itemRefs.current.set(index, el);
                                } else {
                                    itemRefs.current.delete(index);
                                }
                            }}
                            className={classNames('suggestion-list__item', {
                                'suggestion-list__item--selected': index === selectedIndex,
                            })}
                            role="option"
                            aria-selected={index === selectedIndex}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onSelect(item);
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            {item.icon && <span className="suggestion-list__icon">{item.icon}</span>}
                            <span className="suggestion-list__display">{item.display}</span>
                            {item.description && (
                                <span className="suggestion-list__description">{item.description}</span>
                            )}
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
}
