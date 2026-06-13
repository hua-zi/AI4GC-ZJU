type HomeSectionHeaderProps = {
  title: string;
};

export default function HomeSectionHeader({ title }: HomeSectionHeaderProps) {
  return (
    <header className="home-section__header">
      <h2 className="section-title-lg">{title}</h2>
    </header>
  );
}
