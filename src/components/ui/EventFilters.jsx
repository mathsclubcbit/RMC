"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Filter, Calendar, ChevronDown, Check } from "lucide-react";

// Custom Dropdown Component
function CustomSelect({
    icon: Icon,
    value,
    onChange,
    options,
    placeholder,
    colorClass,
    defaultValue = "All"
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = options.find(opt => opt === value) || placeholder || value;
    const isAllSelected = value === defaultValue;

    return (
        <div className="relative group" ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-black/40 border ${isOpen ? `border-${colorClass} ring-1 ring-${colorClass}/50` : "border-white/10"} hover:border-${colorClass}/50 rounded-xl py-3 pl-10 pr-10 text-sm text-foreground cursor-pointer transition-all flex items-center justify-between select-none`}
            >
                <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-hover:text-${colorClass} transition-colors`} />

                <span className={`${isAllSelected ? "text-muted" : "text-white font-medium"} truncate`}>
                    {isAllSelected ? placeholder : value}
                </span>

                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        <div
                            onClick={() => {
                                onChange(defaultValue);
                                setIsOpen(false);
                            }}
                            className={`px-4 py-3 text-sm cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between ${value === defaultValue ? `text-${colorClass}` : "text-muted"}`}
                        >
                            <span>{placeholder}</span>
                            {value === defaultValue && <Check className="w-4 h-4" />}
                        </div>

                        {options.map((opt) => (
                            <div
                                key={opt}
                                onClick={() => {
                                    onChange(opt);
                                    setIsOpen(false);
                                }}
                                className={`px-4 py-3 text-sm cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between ${value === opt ? "text-white bg-white/5" : "text-gray-400"}`}
                            >
                                <span className={value === opt ? `text-${colorClass}` : ""}>{opt}</span>
                                {value === opt && <Check className={`w-4 h-4 text-${colorClass}`} />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EventFilters({
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedYear,
    setSelectedYear,
    categories,
    years
}) {
    return (
        <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6 mb-12 relative z-20">
            <div className="grid md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-teal transition-colors" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/50 transition-all placeholder:text-muted/50"
                    />
                </div>

                {/* Category Filter */}
                <CustomSelect
                    icon={Filter}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    options={categories}
                    placeholder="All Categories"
                    colorClass="lime"
                />

                {/* Year Filter */}
                <CustomSelect
                    icon={Calendar}
                    value={selectedYear}
                    onChange={setSelectedYear}
                    options={years}
                    placeholder="All Years"
                    colorClass="coral"
                />
            </div>
        </div>
    );
}
