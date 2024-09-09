// components
import Wrapper from 'components/footer/Wrapper'
import Item from 'components/footer/Item'
import MoveBtn from 'components/footer/MoveBtn'

const Footer = ({ title, nowPage, totalPage, onPageMove, loading }: Props) => {
  return (
    <Wrapper className='max-w-screen-xl m-auto'>
      <MoveBtn type="PREV" onClick={() => onPageMove("PREV")} />
      <Item text={title} />
      <Item text={loading ? "로딩 중..." : `${nowPage} / ${totalPage}`} /> {/* 로딩 상태에 따른 표시 */}
      <MoveBtn type="NEXT" onClick={() => onPageMove("NEXT")} />
    </Wrapper>
  );
}


interface Props {
  title: string;
  nowPage: number;
  totalPage: number;
  onPageMove: (type: "PREV" | "NEXT") => void;
  loading?: boolean;
}

export default Footer