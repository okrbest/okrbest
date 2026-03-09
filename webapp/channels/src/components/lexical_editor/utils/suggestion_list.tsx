import React, {useEffect, useRef, useState} from 'react';
import classNames from 'classnames';
import './suggestion_list.scss';

export type SuggestionItem = {
    id: string;
    display: string;
    description?: string;
    icon?: React.ReactNode;
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

    useEffect(() => {
        setSelectedIndex(0);
    }, [items]);

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

    return (
        <div ref={listRef} className="lexical-suggestion-list" role="listbox">
            {header && <div className="suggestion-list__header">{header}</div>}
            {loading && <div className="suggestion-list__loading">{'Loading...'}</div>}
            {items.map((item, index) => (
                <div
                    key={item.id}
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
            ))}
        </div>
    );
}
