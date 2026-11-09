"use client";
import { useEffect, useState } from "react";
import SpinningCoin from "@/components/SpinningCoin";
import AnimatedSocialIcons from "@/components/AnimatedSocialIcons";

export default function SidebarRight(props) {
  const [topPosts, setTopPosts] = useState([]);

  useEffect(() => {
    const fetchTopPosts = async () => {
      // Make GET request to the new route to fetch the top 5 most viewed posts
      const response = await fetch("/api/post/topPosts");
      if (response.ok) {
        const posts = await response.json();
        setTopPosts(posts);
      }
    };

    fetchTopPosts();
  }, []);

  const years = [
    { year: 2026, url: "/year/2026" },
    { year: 2025, url: "/year/2025" },
    { year: 2024, url: "/year/2024" },
    { year: 2023, url: "/year/2023" },
    { year: 2022, url: "/year/2022" },
    { year: 2021, url: "/year/2021" },
    { year: 2020, url: "/year/2020" },
    { year: 2019, url: "/year/2019" },
    { year: 2018, url: "/year/2018" },
  ];

  const outros = [
    { nome: "Tutoriais de Instalação", url: "/category/tutoriais" },
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
    <div
      className="mx-auto flex  hidden flex-col gap-8 self-start p-5  dark:text-gray-100 md:hidden  lg:flex"
      style={{
        margin: "40px",
        maxWidth: "380px",
        backgroundColor: "rgb(0, 0, 0, 0.1)",
        borderRadius: "15px",
      }}
    >
      {/* Donation Section */}
      <a href="/doacao">
        <div className="flex flex-col items-center justify-center">
          <b>
            <h1
              style={{
                fontSize: "20px",
                backgroundColor: "red",
                padding: "8px 16px",
                textAlign: "center",
                color: "white",
                width: "320px",
                borderRadius: "25px",
              }}
            >
              Doe e incentive
            </h1>
          </b>
          <b>
            <p style={{ margin: "20px 10px", textAlign: "justify" }}>
              Se você curte nosso trabalho, faça uma doação de qualquer valor,
              irá nos ajudar d+ com os custos deste trabalho que apesar de tudo,
              nós distribuímos gratuitamente! <br />
              <br /> Clique na moeda abaixo para ir à nossa página de doação!
            </p>
          </b>
          <SpinningCoin />
        </div>
      </a>

      {/* Social Media Section */}
      <div className="flex flex-col items-center justify-center">
        <b>
          <h1 className="w-80 rounded-[25px] bg-red-500 px-4 py-2 text-center text-[20px] text-white">
            Nos sigam nas redes sociais
          </h1>
        </b>
        <AnimatedSocialIcons icons_list_url={icons_list_url} />
      </div>

      {/* Yearly Translations Section */}
      <div className="flex flex-col items-center justify-center">
        <h1 className="mb-[30px] w-80 rounded-[25px] bg-red-500 px-4 py-2 text-center text-[20px] font-bold text-white">
          Marcadores
        </h1>
        <div className="flex flex-col gap-3">
          {years.map(({ year, url }) => (
            <a key={year} href={url} className="no-underline">
              <h1 className="w-80 rounded-[25px] bg-red-500 px-4 py-2 text-center text-[20px] font-bold text-white hover:bg-red-700">
                Traduções em {year}
              </h1>
            </a>
          ))}
          {outros.map(({ nome, url }) => (
            <a key={nome} href={url} className="no-underline">
              <h1 className="w-80 rounded-[25px] bg-red-500 px-4 py-2 text-center text-[20px] font-bold text-white hover:bg-red-700">
                {nome}
              </h1>
            </a>
          ))}
        </div>
      </div>

      {/* Discord Widget */}
      <iframe
        src="https://discord.com/widget?id=371132558500560896&theme=dark"
        allowtransparency="true"
        frameBorder="0"
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        style={{
          height: "500px",
        }}
      ></iframe>

      {/* Discord Invitation */}
      <a
        href="https://discord.gg/ag6YHvzWVD"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src="/static/pedido.webp" alt="" />
      </a>

      {/* Top 5 Most Viewed Posts Section */}
      <div className="flex flex-col items-center justify-center">
        <h1 className="mb-[30px] w-80 rounded-[25px] bg-red-500 px-4 py-2 text-center text-[20px] font-bold text-white dark:bg-red-700">
          Conteúdo Popular
        </h1>
        <div className="flex flex-col items-center justify-center gap-3">
          {topPosts.length > 0 ? (
            topPosts.map((post) => (
              <a
                key={post.slug.current}
                href={`/post/${post.slug.current}`}
                className="no-underline"
              >
                <div
                  className="flex items-center justify-start gap-4 border-b-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                  style={{ paddingLeft: "10px" }}
                >
                  {/* Main Image */}
                  {/* Main Image */}
                  <div className="h-[90px] w-[110px] flex-shrink-0 overflow-hidden rounded-md">
                    <img
                      src={post.imageUrl}
                      alt={post.mainImage?.alt || post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Post Title */}
                  <h1 className="text-[16px] font-bold text-black hover:text-red-500 dark:text-white dark:hover:text-red-400">
                    {post.title}
                  </h1>
                </div>
              </a>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              Carregando postagens...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
