import React, {useCallback, useEffect, useRef, useState} from 'react';
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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % items.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
                break;
            case 'Enter':
            case 'Tab':
                e.preventDefault();
                if (items[selectedIndex]) {
                    onSelect(items[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [items, selectedIndex, onSelect, onClose]);

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
