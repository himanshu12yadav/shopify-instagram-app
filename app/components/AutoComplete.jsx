import {
  Autocomplete,
  Icon,
  InlineStack,
  Select,
  Box,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";


function AutoComplete({captionList }){
    const deselectedOptions = useMemo(()=>[...captionList],[])
    const [selectedOptions, setSelectedOptions] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [options, setOptions] = useState(deselectedOptions);
    const [loading, setLoading] = useState(false);

    console.log(captionList);
    const updateText = useCallback((value)=>{
        setInputValue(value);
        if (!loading){
            setLoading(true);
        }

        setTimeout(()=>{
            if (value == ''){
                setOptions(deselectedOptions);
                setLoading(false);
                return;
            }

            const filterRegex = new RegExp(value, 'i');
            const resultOptions = deselectedOptions.filter((option)=> option.label.match(filterRegex));

            setOptions(resultOptions);
            setLoading(false);
        }, 300);
    }, [deselectedOptions, loading]);


    const updateSelection = useCallback((selected)=>{
        const selectedText = selected.map((selectedItem)=>{
            const matchedOption = options.find((option)=>{
                return option.value.match(selectedItem);
            });

            return matchedOption && matchedOption.label;
        })

        setSelectedOptions(selectedText);
        setInputValue(selectedText[0] || "");
    }, [options]);

    const textField = (
        <Autocomplete.TextField
            onChange={updateText}
            value={inputValue}
            prefix={<Icon source={SearchIcon} tone="base"/>}
            placeholder="Search"
            autoComplete="off"
        />
    );

    return  (
        <div>
            <Autocomplete
                options={options}
                selected={selectedOptions}
                onSelect={updateSelection}
                loading={loading}
                textField={textField}
            />

        </div>
    )

}

export {AutoComplete};
