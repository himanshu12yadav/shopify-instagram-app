import { Select } from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";

export const SelectComponent = ({ allOption = [], option }) => {
  const [selected, setSelected] = useState({});
  const [options, setOptions] = useState([]);

  useEffect(() => {
    let options = allOption?.map((item) => ({
      value: item.instagramUsername,
      label: item.instagramUsername,
    }));

    if (options.length > 0) {
      options.unshift({ label: "Select an option", value: "" });
    } else {
      options = [{ label: "No option", value: "" }];
    }

    setOptions(options);
  }, [allOption]);

  const handleSelectChange = useCallback(
    (value) => {
      setSelected(value);
      option(value);
    },
    [selected],
  );

  return (
    <Select
      label="Username"
      options={options}
      onChange={handleSelectChange}
      value={selected}
    />
  );
};
