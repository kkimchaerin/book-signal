import toast from "react-hot-toast";

export function alertMessage(text = "확인되었습니다.", icon = "✔") {
  toast(text, {
    duration: 3000,
    icon: icon,
    style: {
      background: "#f57e53",
      color: "#fff",
      borderRadius: "8px",
      padding: "18px",
    },
    ariaProps: {
      role: "alert",
      "aria-live": "polite",
    },
  });
}