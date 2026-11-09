"use client";

import { Fragment } from "react";
import { Menu, Transition, Disclosure } from "@headlessui/react";
import Container from "@/components/container";
import Link from "next/link";
import Image from "next/image";
import { urlForImage } from "@/lib/sanity/image";
import cx from "clsx";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { myLoader } from "@/utils/all";
import SearchInput from "./ui/search";
import ThemeSwitch from "@/components/themeSwitch";

export default function NavbarAlt(props) {
  const menu = [
    {
      label: "Copyright",
      href: "/copyright",
    },
    {
      label: "Traduções Concluídas",
      href: "/category/finalizada",
    },
    {
      label: "Traduções em Andamento",
      href: "/category/em-andamento",
    },
    {
      label: "Nossa Equipe",
      href: "/equipe",
    },
    {
      label: "Contato",
      href: "/contato",
    },
    {
      label: "Ajuda/Doação",
      href: "/doacao",
    },
  ];

  return (
    <Container className="flex flex-col items-center justify-center !py-0">
      <nav
        className="my-4"
        style={{
          width: "100vw",
        }}
      >
        <Disclosure>
          {({ open }) => (
            <>
              <div className="flex flex-wrap justify-center lg:flex-nowrap">
                <div className="flex w-full items-center justify-center px-[30px] lg:hidden lg:w-auto">
                  <Link href="/" className="lg:hidden">
                    {props.logo ? (
                      <Image
                        src={urlForImage(props.logo)}
                        alt="Logo"
                        priority={true}
                        width={50}
                        height={50}
                        style={{
                          borderRadius: "50%",
                          marginRight: "20px",
                          minWidth: "50px",
                        }}
                      />
                    ) : (
                      <span className="block text-center">Stablo</span>
                    )}
                  </Link>
                  <div className="ml-auto block lg:hidden">
                    <form action="/search" method="GET">
                      <SearchInput placeholder="Procurar..." />
                    </form>
                  </div>
                  <Disclosure.Button
                    aria-label="Toggle Menu"
                    className="rounded-md px-2 py-1 text-gray-500 focus:text-blue-500 focus:outline-none dark:text-gray-300 lg:hidden "
                  >
                    <svg
                      className="h-6 w-6 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      {open && (
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"
                        />
                      )}
                      {!open && (
                        <path
                          fillRule="evenodd"
                          d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"
                        />
                      )}
                    </svg>
                  </Disclosure.Button>
                  <div className="lg:hidden" style={{ paddingLeft: "20px" }}>
                    {/* Right menu links go here */}
                    <ThemeSwitch />
                  </div>
                </div>

                <div className="flex items-center">
                  <div
                    className="hidden flex-col items-center lg:flex lg:flex-row "
                    style={{ paddingRight: "20px" }}
                  >
                    <Link href="/">
                      {props.logo ? (
                        <Image
                          src={urlForImage(props.logo)}
                          alt="Logo"
                          priority={true}
                          width={60}
                          height={60}
                          style={{
                            borderRadius: "50%",
                            marginRight: "20px",
                            minWidth: "60px",
                          }}
                        />
                      ) : (
                        <span className="block text-center">Stablo</span>
                      )}
                    </Link>
                    {menu.map((item, index) => (
                      <Fragment key={index}>
                        {item.children && item.children.length > 0 ? (
                          <DropdownMenu
                            menu={item}
                            key={index + item.label}
                            items={item.children}
                            mobile={props.mobile}
                          />
                        ) : (
                          <Link
                            href={item.href}
                            key={index + item.label}
                            className="rounded-full text-center font-bold text-gray-600 outline-none ring-blue-100 hover:text-blue-500 focus-visible:text-blue-500 focus-visible:ring-2 dark:text-gray-400 min-[1024px]:text-[12px] min-[1100px]:text-[14px] xl:text-[18px]"
                          >
                            {item.label}
                          </Link>
                        )}
                        {index < menu.length - 1 && (
                          <span
                            key={`sep-${index}`}
                            className="mx-2 text-gray-600"
                          >
                            |
                          </span>
                        )}
                      </Fragment>
                    ))}
                  </div>
                  <div className="hidden lg:block">
                    <form action="/search" method="GET">
                      <SearchInput placeholder="Procurar..." />
                    </form>
                  </div>
                  <div
                    className="hidden lg:block"
                    style={{ paddingLeft: "20px" }}
                  >
                    {/* Right menu links go here */}
                    <ThemeSwitch />
                  </div>
                </div>
              </div>
              <Disclosure.Panel>
                <div className="order-2 -ml-5 mt-5 flex w-full flex-col items-start justify-start px-[30px] lg:hidden">
                  {menu.map((item, index) => (
                    <Fragment key={index}>
                      {item.children && item.children.length > 0 ? (
                        <DropdownMenu
                          menu={item}
                          key={index + item.label}
                          items={item.children}
                          mobile={props.mobile}
                        />
                      ) : (
                        <Link
                          href={item.href}
                          key={index + item.label}
                          className="rounded-full px-5 py-2 text-sm font-medium text-gray-600 outline-none ring-blue-100 hover:text-blue-500 focus-visible:text-blue-500 focus-visible:ring-2 dark:text-gray-400"
                        >
                          {item.label}
                        </Link>
                      )}
                    </Fragment>
                  ))}
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      </nav>
    </Container>
  );
}

const DropdownMenu = ({ menu, items, mobile }) => {
  return (
    <Menu as="div" className="relative text-left">
      {({ open }) => (
        <>
          <Menu.Button
            className={cx(
              "flex items-center gap-x-1 rounded-full px-5 py-2  font-medium outline-none ring-blue-100 transition-all focus-visible:text-blue-500 focus-visible:ring-2",
              open
                ? "text-blue-500 hover:text-blue-500"
                : " text-gray-600 dark:text-gray-400 ",
              mobile ? "w-full px-4 py-2 text-sm" : "inline-block px-4 py-2"
            )}
          >
            <span>{menu.label}</span>
            <ChevronDownIcon className="mt-0.5 h-4 w-4" />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="lg:transition lg:ease-out lg:duration-100"
            enterFrom="lg:transform lg:opacity-0 lg:scale-95"
            enterTo="lg:transform lg:opacity-100 lg:scale-100"
            leave="lg:transition lg:ease-in lg:duration-75"
            leaveFrom="lg:transform lg:opacity-100 lg:scale-100"
            leaveTo="lg:transform lg:opacity-0 lg:scale-95"
          >
            <Menu.Items
              className={cx(
                "z-20 origin-top-left rounded-md  focus:outline-none  lg:absolute lg:left-0  lg:w-56",
                !mobile && "bg-white shadow-lg  dark:bg-gray-800"
              )}
            >
              <div className={cx(!mobile && "py-3")}>
                {items.map((item, index) => (
                  <Menu.Item as="div" key={index}>
                    {({ active }) => (
                      <Link
                        href={item?.path ? item.path : "#"}
                        className={cx(
                          "flex items-center space-x-2 px-5 py-2 text-sm lg:space-x-4",
                          active
                            ? "text-blue-500"
                            : "text-gray-700 hover:text-blue-500 focus:text-blue-500 dark:text-gray-300"
                        )}
                      >
                        <span> {item.title}</span>
                      </Link>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
};
