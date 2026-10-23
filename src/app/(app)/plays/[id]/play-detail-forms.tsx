"use client";

import { DeleteButton } from "@/components/leave";
import { deletePlay } from "../actions";

export function DeletePlayButton({ playId }: { playId: string }) {
  return <DeleteButton action={deletePlay} id={playId} />;
}
