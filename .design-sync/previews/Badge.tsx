import React from "react";
import { Badge } from "../../src/components";

export const Saved = () => <Badge state="saved">로컬 저장됨</Badge>;

export const Saving = () => <Badge state="saving">저장 중…</Badge>;

export const Unsaved = () => <Badge state="unsaved">로컬 미저장</Badge>;
