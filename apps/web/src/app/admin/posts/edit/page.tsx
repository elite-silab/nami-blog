import { Suspense } from "react";
import { PostEditor } from "@/components/admin/post-editor";
export default function EditPostPage() { return <Suspense fallback={<p>正在载入编辑器…</p>}><PostEditor mode="edit" /></Suspense>; }
