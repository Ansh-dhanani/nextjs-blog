"use client";

import React, { useState } from "react";
import {
  Button,
  Navbar as NavbarContainer,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/react";
import Link from "next/link";
import LoadingBar from "react-top-loading-bar";

import Icon from "../Icon";
import SearchInput from "../search/SearchInput";
import NavbarProfile from "./NavbarProfile";

import { navLinks } from "./SideNav";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { setProgress } from "@/redux/commonSlice";

const Navbar = () => {
  const dispatch = useAppDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { authStatus } = useAppSelector((state) => state.auth);
  const { progress } = useAppSelector((state) => state.common);

  return (
    <>
      {/* === TOP LOADING BAR === */}
      <LoadingBar
        color="#f11946"
        progress={progress}
        onLoaderFinished={() => dispatch(setProgress(0))}
      />

      <NavbarContainer
        isBordered
        isBlurred
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        maxWidth="full"
        classNames={{
          wrapper:
            "px-3 md:px-6 h-16 sticky top-0 z-50 backdrop-blur-md",
        }}
      >
        {/* ================= LEFT ================= */}
        <NavbarContent justify="start" className="gap-2">
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="sm:hidden"
          />

          <NavbarBrand className="flex items-center gap-2">
            <Button
              as={Link}
              href="/"
              isIconOnly
              radius="sm"
              aria-label="Home"
              className="bg-black text-white font-bold"
            >
              TEN
            </Button>
          </NavbarBrand>
        </NavbarContent>

        {/* ================= CENTER ================= */}
        <NavbarContent
          justify="center"
          className="hidden md:flex w-full max-w-xl"
        >
          <SearchInput />
        </NavbarContent>

        {/* ================= RIGHT ================= */}
        {authStatus ? (
          <NavbarContent justify="end">
            <NavbarProfile />
          </NavbarContent>
        ) : (
          <NavbarContent justify="end" className="gap-2">
            {/* Mobile Search */}
            <NavbarItem className="md:hidden">
              <Button
                as={Link}
                href="/search"
                variant="light"
                isIconOnly
              >
                <Icon name="search" strokeWidth={1.25} />
              </Button>
            </NavbarItem>

            {/* Sign In (Desktop only) */}
            <NavbarItem className="hidden md:flex">
              <Button
                as={Link}
                href="/signin"
                variant="light"
                color="primary"
                radius="sm"
              >
                Sign in
              </Button>
            </NavbarItem>

            {/* Sign Up */}
            <NavbarItem>
              <Button
                as={Link}
                href="/signup"
                variant="ghost"
                color="primary"
                radius="sm"
                className="border-1.5"
              >
                Create account
              </Button>
            </NavbarItem>
          </NavbarContent>
        )}

        {/* ================= MOBILE MENU ================= */}
        <NavbarMenu>
          {navLinks.map((nav) => (
            <NavbarMenuItem key={nav.id}>
              <Button
                as={Link}
                href={nav.path}
                fullWidth
                variant="light"
                className="justify-start"
                onPress={() => setIsMenuOpen(false)}
              >
                {nav.label}
              </Button>
            </NavbarMenuItem>
          ))}
        </NavbarMenu>
      </NavbarContainer>
    </>
  );
};

export default Navbar;
