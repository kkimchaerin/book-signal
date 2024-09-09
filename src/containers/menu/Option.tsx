import React from 'react'
import { useState, useEffect } from 'react'
// components
import Wrapper from 'components/sideMenu/Wrapper'
import OptionLayout from 'components/option/Layout'
import OptionDropdown from 'components/option/Dropdown'
import OptionSlider from 'components/option/Slider'
import ControlIconBtnWrapper from 'components/option/ControlIconBtnWrapper'
import ControlIconBtn from 'components/option/ControlIconBtn'
// types
import { BookStyle, BookFontFamily, BookFlow } from 'types/book'
import { MenuControl } from 'lib/hooks/useMenu'
import { BookOption } from 'types/book'

const Option = ({ 
  control, 
  bookStyle,
  bookOption,
  bookFlow,
  onToggle, 
  emitEvent,
  onBookStyleChange,
  onBookOptionChange
}: Props, ref: any) => {
  const [fontFamily, setFontFamily] = useState<BookFontFamily>(bookStyle.fontFamily);
  const [fontSize, setFontSize] = useState<number>(bookStyle.fontSize);
  const [lineHeight, setLineHeight] = useState<number>(bookStyle.lineHeight);
  const [marginHorizontal, setMarginHorizontal] = useState<number>(bookStyle.marginHorizontal);
  const [marginVertical, setMarginVertical] = useState<number>(bookStyle.marginVertical);
  const [isScrollHorizontal, setIsScrollHorizontal] = useState<boolean>(true); // Default: ScrollHorizontal
  const [viewType, setViewType] = useState<ViewType>({
    active: true,
    spread: false // Default: One Page View
  });

  /** Change font family */
  const onSelectFontFamily = (font: BookFontFamily) => setFontFamily(font);

  /** Change font style and layout */
  const onChangeSlider = (type: SliderType, e: any) => {
    if (!e || !e.target) return;
    switch (type) {
      case "FontSize":
        setFontSize(e.target.value);
        break;
      case "LineHeight":
        setLineHeight(e.target.value);
        break;
      case "MarginHorizontal":
        setMarginHorizontal(e.target.value);
        break;
      case "MarginVertical":
        setMarginVertical(e.target.value);
        break;
      default:
        break;
    }
  }

  /** 
   * Select view direction
   * @param type Direction
   */
  const onClickDirection = (type: "Horizontal" | "Vertical") => {
    if (type === "Horizontal") {
      setIsScrollHorizontal(true);
      setViewType({ ...viewType, active: true });
      onBookOptionChange({
        ...bookOption,
        flow: "paginated"
      });
    } else {
      setIsScrollHorizontal(false);
      setViewType({ ...viewType, active: false });
      onBookOptionChange({
        ...bookOption,
        flow: "scrolled-doc"
      });
    }
  }

  /**
   * Select isSpread
   * @param isSpread Whether spread view 
   */
  const onClickViewType = (isSpread: boolean) => {
    if (isSpread) {
      setViewType({ ...viewType, spread: true });
      onBookOptionChange({
        ...bookOption,
        spread: "auto"
      });
    } else {
      setViewType({ ...viewType, spread: false });
      onBookOptionChange({
        ...bookOption,
        spread: "none"
      });
    }
  }

  /* Save userdata */
  useEffect(() => {
    const timer = window.setTimeout(() => { 
      onBookStyleChange({
        fontFamily,
        fontSize,
        lineHeight,
        marginHorizontal,
        marginVertical
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [
    fontFamily, 
    fontSize, 
    lineHeight, 
    marginHorizontal, 
    marginVertical
  ]);

  /** Re-register close event, when after set */
  useEffect(() => emitEvent(), [bookStyle, emitEvent]);

  return (<>
    {control.display && <Wrapper title="Setting"
                                 show={control.open}
                                 onClose={onToggle}
                                 ref={ref}>
      <OptionLayout>
        {/* 첫 번째 메뉴: ScrollHorizontal 기본값, 화면에 표시하지 않음 */}
        {false && <ControlIconBtnWrapper title="View Direction">
          <ControlIconBtn type="ScrollHorizontal"
                          alt="Horizontal View"
                          active={true}
                          isSelected={isScrollHorizontal}
                          onClick={() => onClickDirection("Horizontal")} />
          <ControlIconBtn type="ScrollVertical" 
                          alt="Vertical View"
                          active={true}
                          isSelected={!isScrollHorizontal}
                          onClick={() => onClickDirection("Vertical")} />
        </ControlIconBtnWrapper>}

        {/* 두 번째 메뉴: One Page View 기본값 설정, 화면에 표시하지 않음 */}
        {false && <ControlIconBtnWrapper title="View Spread">
          <ControlIconBtn type="BookOpen" 
                          alt="Two Page View"
                          active={viewType.active}
                          isSelected={viewType.spread}
                          onClick={() => onClickViewType(true)} />
          <ControlIconBtn type="BookClose" 
                          alt="One Page View"
                          active={viewType.active}
                          isSelected={!viewType.spread}
                          onClick={() => onClickViewType(false)} />
        </ControlIconBtnWrapper>}

        {/* 세 번째 메뉴: 변경 없음 */}
        <OptionDropdown title="Font"
                        defaultValue={fontFamily}
                        valueList={["Origin", "Roboto"]}
                        onSelect={onSelectFontFamily} />
        
        {/* 네 번째 메뉴: 변경 없음 */}
        <OptionSlider active={true}
                      title="Size"
                      minValue={8}
                      maxValue={36}
                      defaultValue={fontSize}
                      step={1}
                      onChange={(e) => onChangeSlider("FontSize", e)} />

        {/* 다섯 번째 메뉴: 변경 없음 */}
        <OptionSlider active={true}
                      title="Line height"
                      minValue={1}
                      maxValue={3}
                      defaultValue={lineHeight}
                      step={0.1}
                      onChange={(e) => onChangeSlider("LineHeight", e)} />
        
        {/* 여섯 번째 메뉴: 화면의 가운데 정렬 */}
        <OptionSlider active={true}
                      title="Horizontal margin"
                      minValue={0}
                      maxValue={100}
                      defaultValue={marginHorizontal}
                      step={1}
                      onChange={(e) => onChangeSlider("MarginHorizontal", e)}
                      />

        {/* 마지막 메뉴: 화면에 표시하지 않음 */}
        {false && <OptionSlider active={bookFlow === "paginated"}
                      title="Vertical margin"
                      minValue={0}
                      maxValue={100}
                      defaultValue={marginVertical}
                      step={1}
                      onChange={(e) => onChangeSlider("MarginVertical", e)} />}
      </OptionLayout>
    </Wrapper>}
  </>);
}

interface Props {
  control: MenuControl;
  bookStyle: BookStyle;
  bookOption: BookOption;
  bookFlow: BookFlow;
  onToggle: () => void;
  emitEvent: () => void;
  onBookStyleChange: (bookStyle: BookStyle) => void;
  onBookOptionChange: (bookOption: BookOption) => void;
}

type SliderType = "FontSize" 
  | "LineHeight" 
  | "MarginHorizontal" 
  | "MarginVertical";

type ViewType = {
  active: boolean,
  spread: boolean
}

export default React.forwardRef(Option)
