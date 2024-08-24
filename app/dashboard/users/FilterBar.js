import { useState } from 'react';

const FilterBar = ({ onFilterChange }) => {
  const [selectedFilters, setSelectedFilters] = useState([]);

  const filters = [
    "Highest number of orders",
    "Lowest number of orders",
    "Mainland",
    "Island",
    "Outskirt",
    "Business Category"
  ];

  const handleFilterChange = (filter) => {
    const updatedFilters = selectedFilters.includes(filter)
      ? selectedFilters.filter(f => f !== filter)
      : [...selectedFilters, filter];
    
    setSelectedFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => handleFilterChange(filter)}
          className={`px-3 py-1 rounded-full text-sm ${
            selectedFilters.includes(filter)
              ? 'bg-[#733E70] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};

export default FilterBar;