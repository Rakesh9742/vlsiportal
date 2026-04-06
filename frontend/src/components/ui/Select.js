import React, { createContext, useContext, useState, useRef, useEffect, Children } from 'react';
import { createPortal } from 'react-dom';
import { FaChevronDown, FaCheck } from 'react-icons/fa';
import './Select.css';

// Context for Select component
const SelectContext = createContext();

// Main Select component
export const Select = ({ children, value, onValueChange, defaultValue, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || '');
  const [selectedLabel, setSelectedLabel] = useState('');
  const selectRef = useRef(null);
  const triggerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
      // Find and set the label for the current value
      updateSelectedLabel(value);
    }
  }, [value, children]);

  // Function to update selected label based on current value
  const updateSelectedLabel = (currentValue) => {
    if (!currentValue || !children) {
      setSelectedLabel('');
      return;
    }

    // Find the SelectItem with matching value
    const findLabelInChildren = (childrenArray) => {
      for (const child of childrenArray) {
        if (child?.props?.children) {
          if (Array.isArray(child.props.children)) {
            const result = findLabelInChildren(child.props.children);
            if (result) return result;
          } else if (child.props.children?.props?.children) {
            const result = findLabelInChildren(Children.toArray(child.props.children.props.children));
            if (result) return result;
          }
        }
        
        if (child?.props?.value === currentValue) {
          return child.props.children;
        }
      }
      return null;
    };

    const label = findLabelInChildren(Children.toArray(children));
    if (label) {
      setSelectedLabel(label);
    }
  };

  // Initialize and update label when selectedValue or children change
   useEffect(() => {
     if (selectedValue && children) {
       updateSelectedLabel(selectedValue);
     }
   }, [children, selectedValue]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideTrigger = selectRef.current && selectRef.current.contains(event.target);
      const clickedInsideContent = contentRef.current && contentRef.current.contains(event.target);

      if (!clickedInsideTrigger && !clickedInsideContent) {
        console.log('Click outside detected, closing dropdown');
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Only add the listener when dropdown is open
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  const handleValueChange = (newValue, label) => {
    setSelectedValue(newValue);
    setSelectedLabel(label);
    setIsOpen(false);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  const contextValue = {
    isOpen,
    setIsOpen: (newIsOpen) => {
      console.log('Setting isOpen to:', newIsOpen);
      setIsOpen(newIsOpen);
    },
    selectedValue,
    selectedLabel,
    setSelectedLabel,
    triggerRef,
    contentRef,
    handleValueChange,
    disabled
  };

  return (
    <SelectContext.Provider value={contextValue}>
      <div className="select-container" ref={selectRef}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

// Select Trigger component
export const SelectTrigger = ({ children, className = '', placeholder }) => {
  const { isOpen, setIsOpen, selectedLabel, disabled, triggerRef } = useContext(SelectContext);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Select trigger clicked, disabled:', disabled, 'current isOpen:', isOpen);
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <button
      ref={triggerRef}
      type="button"
      className={`select-trigger ${className} ${isOpen ? 'select-trigger--open' : ''} ${disabled ? 'select-trigger--disabled' : ''}`}
      onClick={handleClick}
      disabled={disabled}
    >
      <span className="select-trigger__content">
        {selectedLabel || placeholder || 'Select an option'}
      </span>
      <FaChevronDown className={`select-trigger__icon ${isOpen ? 'select-trigger__icon--rotated' : ''}`} />
    </button>
  );
};

// Select Value component
export const SelectValue = ({ placeholder }) => {
  const { selectedLabel } = useContext(SelectContext);
  
  return (
    <span className="select-value">
      {selectedLabel || placeholder || 'Select an option'}
    </span>
  );
};

// Select Content component
export const SelectContent = ({ children, className = '', portal = false, side = 'down' }) => {
  const { isOpen, triggerRef, contentRef } = useContext(SelectContext);
  const [contentStyle, setContentStyle] = useState({});
  const [positionClass, setPositionClass] = useState('select-content--down');

  const updatePosition = () => {
    if (!portal || !triggerRef?.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const estimatedMenuHeight = 260;
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    const shouldOpenUp = side === 'up' || (side === 'auto' && spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow);

    setPositionClass(shouldOpenUp ? 'select-content--portal-up' : 'select-content--portal-down');
    setContentStyle({
      position: 'fixed',
      left: `${rect.left}px`,
      top: shouldOpenUp ? `${rect.top - 4}px` : `${rect.bottom + 4}px`,
      width: `${rect.width}px`,
      zIndex: 2200
    });
  };

  useEffect(() => {
    if (!isOpen || !portal) return;

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, portal, side]);

  useEffect(() => {
    if (!portal) {
      setPositionClass(side === 'up' ? 'select-content--up' : 'select-content--down');
    }
  }, [portal, side]);

  if (!isOpen) return null;

  const contentNode = (
    <div ref={contentRef} style={portal ? contentStyle : undefined} className={`select-content ${className} ${positionClass} ${portal ? 'select-content--portal' : ''}`}>
      <div className="select-content__inner">
        {children}
      </div>
    </div>
  );

  if (portal) {
    return createPortal(contentNode, document.body);
  }

  return contentNode;
};

// Select Group component
export const SelectGroup = ({ children }) => {
  return (
    <div className="select-group">
      {children}
    </div>
  );
};

// Select Label component
export const SelectLabel = ({ children, className = '' }) => {
  return (
    <div className={`select-label ${className}`}>
      {children}
    </div>
  );
};

// Select Item component
export const SelectItem = ({ value, children, className = '', disabled = false }) => {
  const { selectedValue, handleValueChange } = useContext(SelectContext);
  const isSelected = selectedValue === value;

  const handleClick = () => {
    if (!disabled) {
      handleValueChange(value, children);
    }
  };

  return (
    <div
      className={`select-item ${className} ${isSelected ? 'select-item--selected' : ''} ${disabled ? 'select-item--disabled' : ''}`}
      onClick={handleClick}
    >
      <span className="select-item__content">{children}</span>
      {isSelected && <FaCheck className="select-item__check" />}
    </div>
  );
};

// Export all components as default
export default {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem
};