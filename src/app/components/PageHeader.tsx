interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 mb-8">
      <h1 className="font-['Manrope',sans-serif] font-extrabold text-[30px] leading-[36px] text-[#1a1b22] tracking-[-0.75px]">
        {title}
      </h1>
      {subtitle && (
        <p className="font-['Inter',sans-serif] font-normal text-[16px] leading-[24px] text-[#444653]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
