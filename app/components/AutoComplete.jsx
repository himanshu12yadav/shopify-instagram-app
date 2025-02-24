import {
  Autocomplete,
  Icon,
  InlineStack,
  Select,
  Box,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";

// function AutoComplete({
//   captionList,
//   filterOptions,
//   setInputValue: setSearchTerm,
//   setFilterValue,
//   selectedAccount,
//   searchTerm
// }) {

//   const deselectedOptions = useMemo(() => [...captionList], []);
//   const [selectedOptions, setSelectedOptions] = useState("");
//   const [inputValue, setLocalInputValue] = useState("");
//   const [options, setOptions] = useState(deselectedOptions);
//   const [isLoading, setIsLoading] = useState(false);
//   const [filterOptionLocal, setFilterOptionLocal] = useState("all");



//   useEffect(() => {
//     if (searchTerm?.length > 0) {
//       setSelectedOptions(searchTerm);
//       setLocalInputValue(searchTerm[0]);
//     }
//   }, [deselectedOptions, searchTerm])



//   const updateText = useCallback(
//     (value) => {
//       setIsLoading(true);
//       setLocalInputValue(value);

//       if (value === "") {
//         setOptions(deselectedOptions);
//         setSelectedOptions([]);
//         return;
//       }

//       const filterRegx = new RegExp(value, "i");
//       const resultOptions = deselectedOptions.filter((option) =>
//         option.label.match(filterRegx),
//       );
//       setSearchTerm(value);
//       setOptions(resultOptions);
//       setIsLoading(false);
//     },

//     [deselectedOptions, setSearchTerm],
//   );

//   const handleSelected = useCallback(
//     (selected) => {
//       const selectedValue = selected.map((selectedItem) => {
//         const matchedOption = options.find((option) =>
//           option.value.match(selectedItem),
//         );

//         return matchedOption && matchedOption.label;
//       });

//       setSearchTerm(selectedValue);
//       setSelectedOptions(selectedValue);
//       setLocalInputValue(selectedValue[0] || "");

//     },
//     [options, setSearchTerm],
//   );

//   const handleFilter = useCallback((value) => {
//     setFilterValue(value);
//     setFilterOptionLocal(value);
//   }, []);


//   const textField = (
//     <Autocomplete.TextField
//       onChange={updateText}
//       value={inputValue}
//       prefix={<Icon source={SearchIcon} tone="base" />}
//       placeholder="Search"
//       autocomplete="on"
//     />
//   );

//   return (
//     <Box gap="400">
//       <InlineStack wrap={false} gap="100" align="start" blockAlign="center">
//         <div style={{ width: "100%" }}>
//           <Autocomplete
//             options={options}
//             selected={selectedOptions}
//             textField={textField}
//             onSelect={handleSelected}
//             loading={isLoading}
//           />
//         </div>
//         <div style={{ width: "100px" }}>
//           <Select
//             label="Filter by type"
//             labelHidden
//             value={filterOptionLocal}
//             options={filterOptions}
//             onChange={handleFilter}
//             tone="magic"
//           />
//         </div>
//       </InlineStack>
//     </Box>
//   );
// }

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
