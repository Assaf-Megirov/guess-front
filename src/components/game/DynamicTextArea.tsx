import { useState, useRef, useEffect, use } from 'react';

interface DynamicTextareaProps {
    disabled: boolean;
    value?: string;
    onChange?: (value: string) => void;
    onEnter?: (word: string) => Promise<boolean>;
    placeholder?: string;
    className?: string;
    initialFontSize?: number;
    minFontSize?: number;
}

/**
 * 
 * @param disabled - disables the textarea
 * @param value - overrides the value (when this prop changes the new value overrides the internal value)
 * @param onChange - called when the internal value changes
 * @param onEnter - called when the enter key is pressed
 * @param placeholder - placeholder text
 * @param className - className for the textarea
 * @param initialFontSize - initial font size
 * @param minFontSize - minimum font size
 */
const DynamicTextarea: React.FC<DynamicTextareaProps> = ({ disabled, value, onChange, onEnter,placeholder, className, initialFontSize, minFontSize }) => {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [internalValue, setinternalValue] = useState('');
  const [invalidWord, setInvalidWord] = useState(false);

  if(!initialFontSize) initialFontSize = 48;
  if(!minFontSize) minFontSize = initialFontSize / 4;
  const defaultClasses =
  'w-full h-full resize-none bg-transparent border-0 text-center font-bold focus:outline-none appearance-none whitespace-nowrap overflow-hidden';
  const combinedClassName = className
    ? `${defaultClasses} ${className}`
    : defaultClasses;

  const maxLength = 45; //longest english word

  const adjustFontSize = () => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    textarea.style.fontSize = `${initialFontSize}px`;
    let fontSize = initialFontSize;

    while (
      (textarea.scrollHeight > textarea.clientHeight ||
        textarea.scrollWidth > textarea.clientWidth) &&
      fontSize > minFontSize
    ) {
      fontSize -= 1;
      textarea.style.fontSize = `${fontSize}px`;
    }
  };

  useEffect(() => {
    const handleEnterInternal = async (e: KeyboardEvent) => {
      //handle enter even if a text area is focused
      if(document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA'){
        //if a text area is active make sure the enter press wasnt registered there as it is handled here
        e.preventDefault();
      }
      if(onEnter){
        const valid = await onEnter(internalValue);
        if(valid){
          //if its a valid move
          setinternalValue(''); //clear
          if (textAreaRef.current) {
              textAreaRef.current.value = '';
          }
        }else{
          //if its not a valid move
          //underline the text in red until next change
          setInvalidWord(true);
        }
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      if (e.key === 'Enter'){
        handleEnterInternal(e);
        return;
      }

      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        const newValue = internalValue.slice(0, -1);
        setinternalValue(newValue);
        if (textAreaRef.current) {
            textAreaRef.current.value = newValue;
        }
        setInvalidWord(false);
        return;
      }

      if (e.key.length === 1 && 
          (!e.altKey && !e.ctrlKey && !e.metaKey) && 
          internalValue.length < maxLength) {
        const newValue = internalValue + e.key;
        setinternalValue(newValue);
        if (textAreaRef.current) {
            textAreaRef.current.value = newValue;
        }
        setInvalidWord(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [disabled, internalValue, maxLength]);

  useEffect(() => { //external value overrides internal
    if(value !== undefined && value !== internalValue)
        setinternalValue(value);
  }, [value]);

  useEffect(() => { //internal value makes it known that a change has been made and the parent can decide what to do
    adjustFontSize();
    if(onChange) onChange(internalValue);
    setInvalidWord(false);
  }, [internalValue]);

  useEffect(() => {
    if(invalidWord){
      if (textAreaRef.current) {
          textAreaRef.current.style.textDecoration = 'underline';
          textAreaRef.current.style.textDecorationColor = 'red';
          textAreaRef.current.style.textDecorationThickness = '2px';
      }
    }else{
      if (textAreaRef.current) {
          textAreaRef.current.style.textDecoration = 'none';
      }
    }
  }, [invalidWord]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setinternalValue(e.target.value);
    setInvalidWord(false);
  }

  return (
    <textarea
      ref={textAreaRef}
      className={combinedClassName}
      style={{
        fontSize: `${initialFontSize}px`,
        lineHeight: '1.2',
        textAlign: 'center',
        fontWeight: 'bold',
      }}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
    />
  );
};

export default DynamicTextarea;
