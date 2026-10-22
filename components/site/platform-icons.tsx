import { Laptop, Monitor, Smartphone, Tablet } from "lucide-react";
import { BsQuestionCircle } from "react-icons/bs";
import { FaAndroid, FaApple, FaChrome, FaEdge, FaFirefox, FaLinux, FaMobile, FaOpera, FaSafari, FaWindows } from "react-icons/fa";

const size = "h-4 w-4";

const OS_ICONS: Record<string, React.ReactNode> = {
  windows: <FaWindows className={`${size} text-blue-400`} />,
  macos: <FaApple className={`${size} text-gray-300`} />,
  linux: <FaLinux className={`${size} text-yellow-400`} />,
  android: <FaAndroid className={`${size} text-green-400`} />,
  ios: <FaMobile className={`${size} text-gray-300`} />,
};

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  desktop: <Monitor className={`${size} text-blue-400`} />,
  laptop: <Laptop className={`${size} text-green-400`} />,
  tablet: <Tablet className={`${size} text-purple-400`} />,
  mobile: <Smartphone className={`${size} text-red-400`} />,
};

const BROWSER_ICONS: Record<string, React.ReactNode> = {
  chrome: <FaChrome className={`${size} text-blue-400`} />,
  firefox: <FaFirefox className={`${size} text-orange-400`} />,
  safari: <FaSafari className={`${size} text-blue-300`} />,
  edge: <FaEdge className={`${size} text-blue-500`} />,
  opera: <FaOpera className={`${size} text-red-400`} />,
};

const unknown = <BsQuestionCircle className={`${size} text-neutral-400`} />;

export function osIcon(name: string) {
  return OS_ICONS[name.toLowerCase()] ?? unknown;
}

export function deviceIcon(name: string) {
  return DEVICE_ICONS[name.toLowerCase()] ?? unknown;
}

export function browserIcon(name: string) {
  return BROWSER_ICONS[name.toLowerCase()] ?? unknown;
}
