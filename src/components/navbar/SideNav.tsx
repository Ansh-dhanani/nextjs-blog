import { Button } from "@heroui/react";
import Link from "next/link";
import React from "react";
import Icon from "../Icon";

const SideNav = () => {
  return (
    <nav className="sticky top-[90px] left-0 flex justify-between flex-col h-[calc(100vh_-_110px)]">
      <ul>
        {navLinks.map((link) => (
          <li key={link.id} className="mb-2 group">
            <Button
              href={link.path ? `${link.path}` : "/"}
              className="justify-start bg-gray-100 text-black hover:text-primary group"
              as={Link}
              variant="light"
              color="primary"
              fullWidth
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Button>
          </li>
        ))}
      </ul>
      <ul className="flex justify-between items-center">
        <li>
          <Button
            as={Link}
            href="https://github.com/Ansh-dhanani"
            target="_blank"
            isIconOnly
            variant="light"
            color="primary"
            className="text-black group"
          >
            <Icon name="github" strokeWidth={1.25} />
          </Button>
        </li>
        <li>
          <Button
            as={Link}
            href="https://x.com/AnshDhanan64704"
            target="_blank"
            isIconOnly
            variant="light"
            color="primary"
            className="text-black group"
          >
            <Icon name="twitter" strokeWidth={1.25} />
          </Button>
        </li>
        <li>
          <Button
            as={Link}
            href="https://www.linkedin.com/in/ansh-dhanani/"
            target="_blank"
            isIconOnly
            variant="light"
            color="primary"
            className="text-black group"
          >
            <Icon name="linkedin" strokeWidth={1.25} />
          </Button>
        </li>
        <li>
          <Button
            as={Link}
            href="https://www.instagram.com/dhanani._.ansh/"
            target="_blank"
            isIconOnly
            variant="light"
            color="primary"
            className="text-black group"
          >
            <Icon name="instagram" strokeWidth={1.25} />
          </Button>
        </li>
      </ul>
    </nav>
  );
};

export default SideNav;

export const navLinks = [
  {
    id: 1,
    label: "Home",
    path: "/",
    icon: <Icon name="home" strokeWidth={1.25} />,
  },
  {
    id: 2,
    label: "Reading List",
    path: "/reading_list",
    icon: <Icon name="bookmark" strokeWidth={1.25} />,
  },
  {
    id: 2.5,
    label: "Notifications",
    path: "/notifications",
    icon: <Icon name="bell" strokeWidth={1.25} />,
  }
];
