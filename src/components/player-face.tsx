import { Avatar } from "@/components/avatar";

/**
 * A Player as a round face with the name underneath, for the Player pickers. The caller passes the
 * selected look: plain classes for a toggle button, or peer-checked: classes after a checkbox.
 */
export function PlayerFace({
  name,
  avatarUrl,
  isMember,
  faceClassName,
  nameClassName,
}: {
  name: string;
  avatarUrl: string | null;
  isMember: boolean;
  faceClassName: string;
  nameClassName: string;
}) {
  return (
    <>
      <span className={`block rounded-full ring-2 ring-offset-2 ring-offset-background transition ${faceClassName}`}>
        <Avatar name={name} url={avatarUrl} size={44} />
      </span>
      <span className={`mt-1 block max-w-16 truncate text-center text-xs ${nameClassName}`}>
        {name}
        {!isMember && <span className="opacity-70"> (inv.)</span>}
      </span>
    </>
  );
}

export const FACE_ON = "opacity-100 ring-accent";
export const FACE_OFF = "opacity-50 ring-transparent grayscale";
export const NAME_ON = "font-semibold text-accent";
export const NAME_OFF = "text-muted";
