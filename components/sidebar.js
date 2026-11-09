import SpinningCoin from "@/components/SpinningCoin";
import AnimatedSocialIcons from "@/components/AnimatedSocialIcons";

export default function SidebarLeft(props) {
  return (
    <div
      className="mx-auto flex  hidden flex-col gap-[50px] self-start p-5  dark:text-gray-100 md:hidden  lg:flex"
      style={{
        margin: "40px",
        maxWidth: "340px",
        backgroundColor: "rgb(0, 0, 0, 0.1)",
        borderRadius: "15px",
      }}
    >
      <iframe
        src="https://discord.com/widget?id=371132558500560896&theme=dark"
        allowtransparency="true"
        frameBorder="0"
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        style={{
          height: "500px",
        }}
      ></iframe>

      <a
        href="https://discord.gg/ag6YHvzWVD"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src="/static/pedido.gif" alt="" />
      </a>
    </div>
  );
}
