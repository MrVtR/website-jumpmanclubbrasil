import Container from "@/components/container";
import { urlForImage } from "@/lib/sanity/image";
import Image from "next/image";
import Link from "next/link";
import AnimatedSocialIcons from "@/components/AnimatedSocialIcons";

export default function About() {
  const authors = [
    { src: "/profile/1.png", url: null },
    {
      src: "/profile/13.png",
      url: "/author/mrvtr",
    },
    { src: "/profile/2.png", url: null },
    { src: "/profile/3.png", url: null },
    { src: "/profile/8.png", url: null },
    { src: "/profile/11.png", url: null },
    { src: "/profile/14.png", url: null },
    { src: "/profile/15.png", url: null },
    { src: "/profile/17.png", url: null },
  ];
  const icons_list_url = [
    {
      name: "facebook",
      url: "https://www.facebook.com/groups/162825860900247",
    },
    {
      name: "x",
      url: "https://x.com/JumpmanClubBR",
    },
    {
      name: "discord",
      url: "https://discord.gg/ag6YHvzWVD",
    },
    {
      name: "instagram",
      url: "https://www.instagram.com/jumpmanclubbrasil/",
    },
    {
      name: "youtube",
      url: "https://www.youtube.com/@Jumpmanclubbrasil",
    },
    {
      name: "whatsapp",
      url: "https://chat.whatsapp.com/CEJUoE9PeId7yzNsEF5eLH",
    },
  ];
  return (
    <Container>
      <h1 className="text-brand-primary mb-3 mt-2 text-center text-3xl font-semibold tracking-tight dark:text-white lg:text-4xl lg:leading-snug">
        Sobre a Nossa Equipe
      </h1>

      <div className="mt-8 grid grid-cols-2 place-items-center gap-4">
        {authors.map((author, index) => {
          return (
            <div key={index} className="block w-[280px]">
              {author.url ? (
                <Link href={author.url} className="h-full w-full">
                  <img src={author.src} alt="" className="h-full w-full" />
                </Link>
              ) : (
                <img src={author.src} alt="" className="h-full w-full" />
              )}
            </div>
          );
        })}
      </div>
      <div className="m-[30px] flex flex-col items-center justify-center">
        <b>
          <h1 className="w-80 rounded-[25px] bg-red-500 px-4 py-2 text-center text-[20px] text-white">
            Nos sigam nas redes sociais
          </h1>
        </b>
        <AnimatedSocialIcons icons_list_url={icons_list_url} />
      </div>
      <div className="prose mx-auto text-center text-[18px] dark:prose-invert">
        <p>
          Quer traduzir jogos e fazer parte da nossa equipe?
          <br />
          <Link href="/contato">Entre em contato conosco!</Link>
        </p>
      </div>
      {/* Social Media Section */}
    </Container>
  );
}
