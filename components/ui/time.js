import { parseISO, format } from "date-fns";
import { cx } from "@/utils/all";
import { ptBR } from "date-fns/locale";

export default function DateTime({ date, className }) {
  return (
    <time className={cx(className && className)} dateTime={date}>
      {format(parseISO(date), "dd 'de' MMMM 'de' yyyy", {
        locale: ptBR
      })}
    </time>
  );
}
