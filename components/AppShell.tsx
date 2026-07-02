"use client";

import { Box, HStack } from "@chakra-ui/react";




export default function AppShell({ children }: { children: React.ReactNode }) {

  return (
    <Box minH="100vh" bg="#f8fafc">
     
        {/* Sticky Sidebar */}

        {/* Main Content */}
        <Box flex="1" minH="100vh">
          {children}
        </Box>
    
    </Box>
  );
}
