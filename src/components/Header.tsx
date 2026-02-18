const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary px-4 py-4 text-center">
      <div className="flex flex-col items-center">
        <h1 className="font-display font-bold text-primary-foreground text-[22px] leading-tight">
          KinéWatch
        </h1>
        <p className="font-body text-primary-foreground text-[14px] leading-tight mt-0.5">
          Veille pour kinésithérapeutes
        </p>
      </div>
    </header>
  );
};

export default Header;
