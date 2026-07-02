"use client";

import { Box, Input, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { MdArrowDropDown, MdArrowDropUp, MdClose } from "react-icons/md";

export type SelectOption = { value: string; label: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  emptyLabel?: string;
};

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Search...",
  emptyLabel = "None",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const select = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <Box ref={containerRef} position="relative">
      {/* Trigger button */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        border="1px solid"
        borderColor={open ? "orange.400" : "gray.200"}
        borderRadius="md"
        px={3}
        py="5px"
        cursor="pointer"
        bg="white"
        minH="32px"
        onClick={() => setOpen((v) => !v)}
        transition="border-color 0.15s"
      >
        <Text
          fontSize="sm"
          color={selected ? "gray.800" : "gray.400"}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          flex={1}
        >
          {selected ? selected.label : emptyLabel}
        </Text>
        <Box color="gray.400" ml={2} flexShrink={0} display="flex" alignItems="center">
          {value ? (
            <Box
              as="span"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); select(""); }}
              cursor="pointer"
              _hover={{ color: "red.400" }}
            >
              <MdClose size={14} />
            </Box>
          ) : open ? (
            <MdArrowDropUp size={18} />
          ) : (
            <MdArrowDropDown size={18} />
          )}
        </Box>
      </Box>

      {/* Dropdown panel */}
      {open && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left={0}
          right={0}
          zIndex={2000}
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          shadow="lg"
          overflow="hidden"
        >
          {/* Search input */}
          <Box px={2} pt={2} pb={1} borderBottom="1px solid" borderColor="gray.100">
            <Input
              ref={inputRef}
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="xs"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              px={2}
              color="gray.800"
              _focus={{ borderColor: "orange.400", boxShadow: "none" }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter" && filtered.length === 1) select(filtered[0].value);
              }}
            />
          </Box>

          {/* Options */}
          <Box maxH="200px" overflowY="auto">
            {filtered.length === 0 ? (
              <Box px={3} py={2}>
                <Text fontSize="xs" color="gray.400" fontStyle="italic">No results</Text>
              </Box>
            ) : (
              filtered.map((o) => (
                <Box
                  key={o.value || "__empty__"}
                  px={3}
                  py="7px"
                  cursor="pointer"
                  fontSize="sm"
                  color={o.value === value ? "orange.600" : "gray.800"}
                  bg={o.value === value ? "orange.50" : "white"}
                  fontWeight={o.value === value ? "semibold" : "normal"}
                  _hover={{ bg: "orange.50", color: "orange.600" }}
                  onClick={() => select(o.value)}
                >
                  {o.label}
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
