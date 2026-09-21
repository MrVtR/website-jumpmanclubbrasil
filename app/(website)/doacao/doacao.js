import Container from "@/components/container";
import { urlForImage } from "@/lib/sanity/image";
import Image from "next/image";
import Link from "next/link";
import AnimatedSocialIcons from "@/components/AnimatedSocialIcons";
export default function Doacao() {
  let icons_list_url = [
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
      <div
        className="flex flex-col items-center justify-center gap-5"
        style={{
          backgroundColor: "rgb(0, 0, 0, 0.1)",
          marginTop: "32px",
          padding: "30px 70px",
          borderRadius: "15px",
        }}
      >
        <img src="/static/doeAgora.png" alt="" />
        <br />
        <br />
        <div className="flex flex-col items-center justify-center">
          <img src="/static/mercado.png" alt="" />
          <p className="font-open mb-0 text-justify indent-[35.45pt] text-[20px] leading-[2]">
            <b>#MERCADPAGO, Mercado Pago</b> é a carteira digital do Mercado
            Livre. Ele funciona como gestor de vendas em sites de e-commerce,
            carteira digital, permite enviar e receber pagamentos e doações pela
            internet, Além de funcionar também como um 'banco' que guarda os
            ganhos recebidos. Você pode utilizar o seu saldo para realizar
            compras em diversas lojas ou adquirir serviços variados como
            recargas de celular e bilhetes de transporte.
          </p>
          <br />
          <img
            src="/static/doacao_botao.png"
            alt=""
            className="self-start pb-[30px] pt-[10px]"
          />
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6 text-center">
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="font-bold">Contribuir com R$ 5,00</p>
              <p className="text-sm text-gray-600">Via Mercado Pago</p>
              <a
                href="http://bit.ly/doemp05%E2%80%8B"
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="mt-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-700">
                  Contribuir com o trabalho
                </button>
              </a>
            </div>

            <div className="rounded-lg bg-white p-4 shadow">
              <p className="font-bold">Contribuir com R$ 10,00</p>
              <p className="text-sm text-gray-600">Via Mercado Pago</p>
              <a
                href="http://bit.ly/doemp10%E2%80%8B%E2%80%8B"
                target="_blank"
                rel="noopener noreferrer"
              >
                {" "}
                <button className="mt-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-700">
                  Contribuir com o trabalho
                </button>{" "}
              </a>
            </div>

            <div className="rounded-lg bg-white p-4 shadow">
              <p className="font-bold">Contribuir com R$ 20,00</p>
              <p className="text-sm text-gray-600">Via Mercado Pago</p>
              <a
                href="http://bit.ly/doemp20%E2%80%8B%E2%80%8B"
                target="_blank"
                rel="noopener noreferrer"
              >
                {" "}
                <button className="mt-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-700">
                  Contribuir com o trabalho
                </button>
              </a>
            </div>

            <div className="rounded-lg bg-white p-4 shadow">
              <p className="font-bold">Contribuir com R$ 50,00</p>
              <p className="text-sm text-gray-600">Via Mercado Pago</p>
              <a
                href="http://bit.ly/doemp50%E2%80%8B"
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="mt-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-700">
                  Contribuir com o trabalho
                </button>
              </a>
            </div>

            <div className="col-span-2 rounded-lg bg-white p-4 shadow">
              <p className="font-bold">Contribuir com R$ 100,00</p>
              <p className="text-sm text-gray-600">Via Mercado Pago</p>
              <a
                href="http://bit.ly/doemp100%E2%80%8B"
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="mt-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-700">
                  Contribuir com o trabalho
                </button>
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <img src="/static/picpayB.png" alt="" />
          <p className="font-open mb-0 text-justify indent-[35.45pt] text-[20px] leading-[2]">
            <b>#PicPay</b> é um aplicativo fintech, disponível para Android e
            iOS que funciona como carteira digital. Ele permite realizar
            pagamentos e doações pelo smartphone com cartão de crédito ou valor
            de transferência, recargas no celular, parcelamento de boletos e
            serviços, além de ser possível dividir a conta de faturas como água
            e energia e pagar em mais de 2,5 milhões estabelecimentos
            diretamente ou através de parcerias com Adquirentes, Também é
            possível reaver parte do pagamento efetuado através de promoções
            eventuais. Você pode acessar nosso link de doação ou simplesmente
            escanear o nosso QR Code para fazer sua doação!
          </p>
          <img
            src="/static/doacao_botao.png"
            alt=""
            className="self-start pb-[10px] pt-[10px]"
          />
          <br />
          <img
            src="/static/picpay.png"
            alt=""
            className="self-start pt-[10px]"
          />
        </div>
        <div className="flex flex-col items-center justify-center">
          <img src="/static/bradesco.png" alt="" />
          <p className="font-open mb-0 text-justify indent-[35.45pt] text-[20px] leading-[2]">
            <b>#BRADESCO </b>Você pode também fazer depósito de qualquer valor,
            indo a uma agência do banco Bradesco, ou se você já tiver uma conta,
            basta fazer uma transferência online. Utilize os dados abaixo.
          </p>
          <img
            src="/static/bradescoB.png"
            alt=""
            className="self-start pb-[10px] pt-[10px]"
          />
          <ul className="font-open self-start text-[20px] leading-[2]">
            <li>
              <b>PIX:</b> alanlainfopixbradesco@protonmail.com
            </li>
            <li>
              <b>CONTA POUPANÇA</b>
            </li>
            <li>
              <b>TITULAR:</b> ALAN SILVA DA CRUZ
            </li>
            <li>
              <b>CPF:</b> 05599102880
            </li>
            <li>
              <b>CÓDIGO DO BANCO:</b> 237 - BANCO BRADESCO S.A.
            </li>
            <li>
              <b>AGÊNCIA:</b> 3012
            </li>
            <li>
              <b>CONTA:</b> 1023712-2
            </li>
          </ul>
        </div>
        <div className="flex flex-col items-center justify-center">
          <img src="/static/interB.png" alt="" />
          <p className="font-open mb-0 text-justify indent-[35.45pt] text-[20px] leading-[2]">
            <b>#BANCOINTER</b> Banco Inter é uma instituição financeira fundada
            em 1994, que oferece abertura de conta digital sem tarifas aos seus
            usuários. Por meio de seu aplicativo, disponível para Android e iOS,
            onde não existe cobrança de taxa ou limite para transferências,
            mesmo para outros bancos. O diferencial do Banco Inter para outros
            bancos digitais, como Neon e Nubank, é o fato de o usuário não ser
            cobrado para realizar saques em Banco24Horas, por exemplo.
          </p>
          <img
            src="/static/inter.png"
            alt=""
            className="self-start pb-[10px] pt-[10px]"
          />
          <ul className="font-open self-start text-[20px] ">
            <li>
              <b>PIX:</b> alanlainfopixbradesco@protonmail.com
            </li>
            <li>
              <b>CONTA CORRENTE</b>
            </li>
            <li>
              <b>TITULAR:</b> ALAN SILVA DA CRUZ
            </li>
            <li>
              <b>CPF:</b> 05599102880
            </li>
            <li>
              <b>CÓDIGO DO BANCO:</b> 077 - Banco Inter S.A.
            </li>
            <li>
              <b>AGÊNCIA:</b> 0001 (Dígito 9, apenas se seu banco pedir)
            </li>
            <li>
              <b>CONTA:</b> 4747934-5
            </li>
          </ul>
        </div>
        <div className="flex flex-col items-center justify-center">
          <img src="/static/fique.png" alt="" />
          <p className="font-open mb-0 text-justify indent-[35.45pt] text-[20px] font-bold leading-[2]">
            Lembre-se de sempre entrar em contato conosco através das redes
            sociais, para assim liberarmos seu acesso aos conteúdos exclusivos
            dos padrinhos/madrinhas, doadores/doadoras!
          </p>
          <AnimatedSocialIcons icons_list_url={icons_list_url} />
        </div>
      </div>
    </Container>
  );
}
