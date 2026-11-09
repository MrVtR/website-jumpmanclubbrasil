import Link from "next/link";
import Label from "@/components/ui/label";

export default function CategoryLabel({
  categories,
  nomargin = false
}) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-[10px]">
      {categories?.length &&
        categories.slice(0).map((category, index) => (
          <Link
            href={`/category/${category.slug.current}`}
            key={index}>
            <Label nomargin="true" color={category.color}>
              {category.title}
            </Label>
          </Link>
        ))}
    </div>
  );
}
