const Index = () => {
  return (
    <div className="splash-gradient flex min-h-screen items-center justify-center">
      <div className="splash-text text-center select-none">
        <h1
          className="leading-none tracking-tight"
          style={{
            fontFamily: "'Montserrat', sans-serif",
            color: '#FDF8F0',
            lineHeight: '0.85',
          }}
        >
          <span
            className="block text-7xl sm:text-8xl md:text-9xl"
            style={{ fontWeight: 900 }}
          >
            APP
          </span>
          <span
            className="block text-7xl sm:text-8xl md:text-9xl"
            style={{ fontWeight: 400 }}
          >
            delivery
          </span>
        </h1>
      </div>
    </div>
  );
};

export default Index;
