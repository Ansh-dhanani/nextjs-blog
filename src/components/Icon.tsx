import {
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineMessage,
  AiOutlineBook,
  AiFillBook,
  AiOutlineUser,
  AiOutlineFileText,
  AiOutlineTeam,
  AiOutlineUserAdd,
  AiOutlineMinus,
  AiOutlineMore,
  AiOutlineRollback,
  AiOutlineDelete,
  AiOutlineEdit,
  AiOutlineSearch,
  AiOutlineHome,
  AiOutlineRise,
  AiOutlineSetting,
  AiOutlineLogout,
  AiOutlineDown,
  AiOutlineRight,
  AiOutlineLeft,
  AiOutlineEye,
  AiOutlineLike,
  AiOutlineBell,
  AiFillBell,
  AiFillGithub,
  AiOutlineTwitter,
  AiFillLinkedin,
  AiFillInstagram,
  AiOutlineClose,
  AiOutlineSwap,
  AiOutlineSmile,
  AiOutlineCreditCard,
  AiOutlineKey,
  AiOutlineBank,
  AiOutlineCalendar,
} from "react-icons/ai";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { LucideProps } from "lucide-react";

const iconMap: Record<string, any> = {
  heart: AiOutlineHeart,
  "heart-fill": AiFillHeart,
  "message-circle": AiOutlineMessage,
  bookmark: AiOutlineBook,
  "bookmark-fill": AiFillBook,
  user: AiOutlineUser,
  newspaper: AiOutlineFileText,
  "message-square": AiOutlineMessage,
  users: AiOutlineTeam,
  "user-plus": AiOutlineUserAdd,
  dot: AiOutlineMinus,
  "more-horizontal": AiOutlineMore,
  reply: AiOutlineRollback,
  trash2: AiOutlineDelete,
  edit: AiOutlineEdit,
  search: AiOutlineSearch,
  home: AiOutlineHome,
  "trending-up": AiOutlineRise,
  settings: AiOutlineSetting,
  "log-out": AiOutlineLogout,
  "chevron-down": FiChevronDown,
  "chevron-right": AiOutlineRight,
  "chevron-left": AiOutlineLeft,
  "chevrons-up-down": AiOutlineSwap,
  eye: AiOutlineEye,
  "thumbs-up": AiOutlineLike,
  bell: AiOutlineBell,
  "bell-fill": AiFillBell,
  github: AiFillGithub,
  twitter: AiOutlineTwitter,
  linkedin: AiFillLinkedin,
  instagram: AiFillInstagram,
  x: AiOutlineClose,
  smile: AiOutlineSmile,
  cog: AiOutlineSetting,
  "key-round": AiOutlineKey,
  "credit-card": AiOutlineCreditCard,
  building: AiOutlineBank,
  cake: AiOutlineCalendar,
};

interface IconProps extends LucideProps {
  name: string;
}

const Icon = ({ name, size = 20, ...props }: IconProps) => {
  const ReactIcon = iconMap[name];

  if (!ReactIcon) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return <ReactIcon size={size} {...props} />;
};

export default Icon;
