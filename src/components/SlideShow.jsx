import React, { useState, useEffect, useRef } from 'react';

const SlideShow = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const slideRef = useRef();

  const totalSlides = slides.length;

  const handleChangeSlide = (newIndex) => {
    setIsAnimating(true);
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    if (isAnimating) return;

    handleChangeSlide(currentIndex + 1);

    if (currentIndex === totalSlides) {
      setTimeout(() => {
        slideRef.current.style.transition = 'none';
        setCurrentIndex(1);
        slideRef.current.style.transform = `translateX(-${100}%)`;
      }, 500);
    }
  };

  const goToPrevious = () => {
    if (isAnimating) return;

    handleChangeSlide(currentIndex - 1);

    if (currentIndex === 1) {
      setTimeout(() => {
        slideRef.current.style.transition = 'none';
        setCurrentIndex(totalSlides);
        slideRef.current.style.transform = `translateX(-${totalSlides * 100}%)`;
      }, 500);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        goToNext();
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [currentIndex, isAnimating]);

  useEffect(() => {
    if (isAnimating) {
      slideRef.current.style.transition = 'transform 500ms ease-in-out';
      slideRef.current.style.transform = `translateX(-${currentIndex * 100}%)`;

      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, isAnimating]);

  const slidesWithClones = [
    slides[slides.length - 1],
    ...slides,
    slides[0],
  ];

  return (
    <div className="relative h-64 overflow-x-clip">
      <div
        ref={slideRef}
        className="absolute inset-0 flex"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: 'transform 500ms ease-in-out',
        }}
      >
        {slidesWithClones.map((slide, index) => (
          <div
            key={index}
            className="w-full rounded-lg  flex-shrink-0 flex items-center justify-between px-40"
            style={{
              background: slide.background,
              height: '100%'
            }}
          >
            <div className="flex-1 text-left">
              <h2 className="text-[28px] font-bold mb-7 text-white">{slide.title}</h2>
              <p className="mt-2 text-[20px] text-white leading-relaxed" 
              dangerouslySetInnerHTML={{ __html: slide.description.replace(/\n/g, '<br />') }}/>
            </div>
            <div className="flex-shrink-0 relative flex " style={{ top: '44px', width: '228px', height: '300px', perspective: '1000px'}}>
              <img
                src={slide.image}
                alt={slide.title}
                className="rounded  object-cover"
                style={{ height: '100%', width: '100%' ,
                  boxShadow: '10px 15px 15px rgba(0, 0, 0, 0.6)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',}}
              />
            </div>

          </div>
        ))}
      </div>

      <button
        onClick={goToPrevious}
        className="ml-7 absolute top-1/2 left-0 transform -translate-y-1/2 p-3 bg-white bg-opacity-20 rounded-full text-white"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="mr-7 absolute top-1/2 right-0 transform -translate-y-1/2 p-3 bg-white bg-opacity-20 rounded-full text-white"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>


  );
};

export default SlideShow;
