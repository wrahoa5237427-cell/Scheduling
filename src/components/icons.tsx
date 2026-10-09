// Một bộ icon duy nhất: lưới 24px, nét 1.75, đầu nét tròn.
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Svg(props: IconProps) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export const IconDashboard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
  </Svg>
);

export const IconTasks = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </Svg>
);

export const IconProjects = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
  </Svg>
);

export const IconFocus = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="13" r="7.5" />
    <path d="M12 9v4l2.5 1.5M9.5 3.5h5" />
  </Svg>
);

export const IconGoals = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="0.8" />
  </Svg>
);

export const IconPlus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

export const IconTrash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 7h15M10 7V4.5h4V7M6.5 7l1 12.5h9l1-12.5M10 11v5M14 11v5" />
  </Svg>
);

export const IconAlert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4 3 19.5h18z" />
    <path d="M12 10v4.5M12 17.2v.1" />
  </Svg>
);

export const IconPlay = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 5.5v13l10.5-6.5z" />
  </Svg>
);

export const IconPause = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8.5 5.5v13M15.5 5.5v13" />
  </Svg>
);

export const IconStop = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" />
  </Svg>
);

export const IconLogout = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.5 4.5h-4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h4M15 8l4 4-4 4M19 12H9.5" />
  </Svg>
);

export const IconClose = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);
