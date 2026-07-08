import React, { useState } from "react";
import { X, UploadCloud, AlertCircle, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Input, Select, Textarea, Button, Checkbox, Card } from "@amazecontinuityprojects/amazeui";

export default function UploadPaperModal({ isOpen, onClose, courses, username, isAdmin = false }) {
 const [courseCode, setCourseCode] = useState("");
 const [customCourseCode, setCustomCourseCode] = useState("");
 const [useCustomCode, setUseCustomCode] = useState(false);
 const [paperType, setPaperType] = useState("CAT 1");
 const [semester, setSemester] = useState("Fall");
 const [year, setYear] = useState(new Date().getFullYear().toString());
 const [title, setTitle] = useState("");
 const [fileUrl, setFileUrl] = useState("");
 const [uploadMode, setUploadMode] = useState<"file" | "json">("file");
 const [jsonText, setJsonText] = useState("");
 const [queueImmediately, setQueueImmediately] = useState(false);
 const [selectedModel, setSelectedModel] = useState("qwen2.5vl:3b");
 const [uploading, setUploading] = useState(false);
 const [success, setSuccess] = useState(false);

 // Cloudflare R2 states
 const [uploadSourceType, setUploadSourceType] = useState<"file" | "drive" | "external">("file");
 const [selectedFile, setSelectedFile] = useState<File | null>(null);

 if (!isOpen) return null;

 const effectiveCourseCode = useCustomCode ? customCourseCode.trim().toUpperCase() : courseCode;

 const handleInsertTemplate = () => {
 setJsonText(
 JSON.stringify(
 [
 {
 question_number: "1",
 question_text: "State and explain Faraday's laws of electrolysis.",
 marks: 5,
 topic_name: "Electrochemistry",
 question_type: "DESCRIPTIVE"
 },
 {
 question_number: "2",
 question_text: "Which of the following elements has the highest electronegativity?",
 marks: 2,
 topic_name: "Periodic Table",
 question_type: "MCQ",
 options: {
 A: "Fluorine",
 B: "Chlorine",
 C: "Oxygen",
 D: "Nitrogen"
 },
 correct_answer: "A"
 }
 ],
 null,
 2
 )
 );
 };

 const handleUpload = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!effectiveCourseCode || !title) return;
 if (uploadMode === "file") {
 if (uploadSourceType === "file" && !selectedFile) return;
 if (uploadSourceType !== "file" && !fileUrl) return;
 }

 let parsedQuestions: any[] = [];
 if (uploadMode === "json") {
 try {
 parsedQuestions = JSON.parse(jsonText);
 if (!Array.isArray(parsedQuestions)) {
 throw new Error("JSON must be a top-level array of question objects");
 }
 for (let i = 0; i < parsedQuestions.length; i++) {
 const q = parsedQuestions[i];
 if (!q.question_text || typeof q.question_text !== "string") {
 throw new Error(`Question ${i + 1} is missing a valid 'question_text'`);
 }
 }
 } catch (err: any) {
 alert("Invalid Questions JSON: " + (err.message || ""));
 return;
 }
 }

 setUploading(true);
 try {
 let res;
 if (uploadMode === "file" && uploadSourceType === "file" && selectedFile) {
 const formData = new FormData();
 formData.append("file", selectedFile);
 formData.append("courseCode", effectiveCourseCode);
 formData.append("title", title);
 formData.append("paperType", paperType);
 formData.append("examSemester", semester);
 formData.append("examYear", year);
 formData.append("uploaderRegNo", username);
 formData.append("isAdmin", String(isAdmin));

 res = await apiFetch("/api/qbank/upload", {
 method: "POST",
 body: formData,
 });
 } else {
 const payload = {
 courseCode: effectiveCourseCode,
 title,
 paperType,
 examSemester: semester,
 examYear: year,
 uploaderRegNo: username,
 fileUrl: uploadMode === "json" ? "DIRECT_JSON" : fileUrl,
 isAdmin
 };

 res = await apiFetch("/api/qbank/upload", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(payload),
 });
 }

 const json = await res.json();
 if (!res.ok || !json.success) {
 throw new Error(json.error || "Upload failed");
 }

 const sourceId = json.sourceId;

 if (uploadMode === "json" && parsedQuestions.length > 0) {
 const bulkRes = await apiFetch("/api/qbank/admin/questions/bulk", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 paperId: sourceId,
 questions: parsedQuestions
 }),
 });
 const bulkJson = await bulkRes.json();
 if (!bulkRes.ok || !bulkJson.success) {
 throw new Error(bulkJson.error || "Failed to insert questions");
 }
 } else if (uploadMode === "file" && isAdmin && queueImmediately) {
 const ocrRes = await apiFetch("/api/admin/ocr", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 paperId: sourceId,
 model: selectedModel
 }),
 });
 const ocrJson = await ocrRes.json();
 if (!ocrRes.ok || !ocrJson.success) {
 throw new Error(ocrJson.error || "Failed to queue for OCR");
 }
 }

 setSuccess(true);
 setTimeout(() => {
 onClose();
 setSuccess(false);
 setCourseCode("");
 setCustomCourseCode("");
 setUseCustomCode(false);
 setTitle("");
 setFileUrl("");
 setJsonText("");
 setQueueImmediately(false);
 setSelectedModel("qwen2.5vl:3b");
 setUploadSourceType("file");
 setSelectedFile(null);
 }, 2000);
 } catch (err: any) {
 console.error(err);
 alert("Failed to upload paper. " + (err.message || ""));
 } finally {
 setUploading(false);
 }
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
 <div className={`bg-background border border-border/50 rounded-2xl shadow-2xl w-full transition-all duration-300 ${isAdmin && uploadMode === "json" ? "max-w-2xl" : "max-w-md"}`}>
 {/* Header */}
 <div className="flex justify-between items-center p-5 border-b border-border/50">
 <div>
 <h2 className="text-xl font-bold text-foreground">Upload Past Paper</h2>
 {isAdmin && <span className="inline-block mt-1 bg-green-100 text-green-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">Admin Mode</span>}
 </div>
 <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
 <X className="w-5 h-5" />
 </Button>
 </div>

 {/* Tabs for Admins */}
 {isAdmin && !success && (
 <div className="flex border-b border-border/50 px-5">
 <button
 type="button"
 onClick={() => setUploadMode("file")}
 className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-all ${
 uploadMode === "file"
 ? "border-accent text-accent"
 : "border-transparent text-muted-foreground hover:text-foreground"
 }`}
 >
 PDF Link Mode
 </button>
 <button
 type="button"
 onClick={() => setUploadMode("json")}
 className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-all ${
 uploadMode === "json"
 ? "border-accent text-accent"
 : "border-transparent text-muted-foreground hover:text-foreground"
 }`}
 >
 Direct JSON Import
 </button>
 </div>
 )}

 {success ? (
 <div className="p-10 text-center flex flex-col items-center">
 <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mb-4">
 <UploadCloud className="w-8 h-8" />
 </div>
 <h3 className="text-lg font-bold text-foreground mb-2">Upload Successful!</h3>
 <p className="text-muted-foreground text-sm">
 {uploadMode === "json"
 ? "Your paper and questions have been imported directly into the Admin review queue."
 : queueImmediately
 ? `Your paper has been uploaded and queued for OCR processing using ${selectedModel === "moondream" ? "Moondream" : "Qwen 3B"}.`
 : "Your paper has been sent to the Admin queue for question extraction and approval."}
 </p>
 {uploadMode === "file" && selectedFile && (
 <div className="mt-4 p-3 bg-muted/50 border border-border/50 rounded-xl text-left w-full text-xs space-y-1 text-foreground">
 <p><strong>File Name:</strong> {selectedFile.name}</p>
 <p><strong>Size:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
 <p><strong>Upload:</strong> <span className="text-green-600 font-semibold">Success</span></p>
 <p><strong>Paper Status:</strong> {queueImmediately ? "OCR Queued" : "Pending Approval"}</p>
 </div>
 )}
 </div>
 ) : (
 <form onSubmit={handleUpload} className="p-5 space-y-4">
 {/* Course Code */}
 <div>
 <div className="flex justify-between items-center mb-1">
 <label className="block text-sm font-medium text-foreground">Course Code</label>
 <button
 type="button"
 onClick={() => setUseCustomCode(!useCustomCode)}
 className="flex items-center gap-1 text-xs text-accent hover:underline"
 >
 <Plus className="w-3 h-3" />
 {useCustomCode ? "Select from list" : "Enter custom code"}
 </button>
 </div>
 {useCustomCode ? (
 <Input
 type="text"
 required
 value={customCourseCode}
 onChange={(e: any) => setCustomCourseCode(e.target.value)}
 placeholder="e.g. CSE2001"
 className="uppercase placeholder:normal-case"
 />
 ) : (
 <Select
 value={courseCode}
 onChange={(e: any) => setCourseCode(e.target.value)}
 options={[
 { value: "", label: "Select a course" },
 ...courses.map((c: any) => ({
 value: c.code,
 label: `${c.code} - ${c.title}`
 }))
 ]}
 />
 )}
 </div>

 {/* Paper Type + Sem + Year */}
 <div className="grid grid-cols-3 gap-3">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Type</label>
 <Select
 value={paperType}
 onChange={(e: any) => setPaperType(e.target.value)}
 options={[
 { value: "CAT 1", label: "CAT 1" },
 { value: "CAT 2", label: "CAT 2" },
 { value: "FAT", label: "FAT" },
 { value: "Quiz", label: "Quiz" },
 { value: "Assignment", label: "Assignment" }
 ]}
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Sem</label>
 <Select
 value={semester}
 onChange={(e: any) => setSemester(e.target.value)}
 options={[
 { value: "Fall", label: "Fall" },
 { value: "Winter", label: "Winter" },
 { value: "Summer", label: "Summer" }
 ]}
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Year</label>
 <Input
 type="number"
 required
 value={year}
 onChange={(e: any) => setYear(e.target.value)}
 />
 </div>
 </div>

 {/* Title */}
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Title</label>
 <Input
 type="text"
 required
 placeholder="e.g. Winter Semester FAT Question Paper"
 value={title}
 onChange={(e: any) => setTitle(e.target.value)}
 />
 </div>

 {/* Conditional input fields based on mode */}
 {uploadMode === "file" ? (
 <>
 {/* Document Source Selection */}
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">
 Document Source
 </label>
 <div className="grid grid-cols-3 gap-2 p-1 bg-muted/50 rounded-xl">
 <button
 type="button"
 onClick={() => { setUploadSourceType("file"); setFileUrl(""); }}
 className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
 uploadSourceType === "file"
 ? "bg-background text-foreground shadow-sm border border-border/50"
 : "text-muted-foreground hover:text-foreground"
 }`}
 >
 PDF Upload
 </button>
 <button
 type="button"
 onClick={() => { setUploadSourceType("drive"); setSelectedFile(null); }}
 className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
 uploadSourceType === "drive"
 ? "bg-background text-foreground shadow-sm border border-border/50"
 : "text-muted-foreground hover:text-foreground"
 }`}
 >
 Google Drive
 </button>
 <button
 type="button"
 onClick={() => { setUploadSourceType("external"); setSelectedFile(null); }}
 className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
 uploadSourceType === "external"
 ? "bg-background text-foreground shadow-sm border border-border/50"
 : "text-muted-foreground hover:text-foreground"
 }`}
 >
 External URL
 </button>
 </div>
 </div>

 {/* Conditional Inputs */}
 {uploadSourceType === "file" && (
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">
 Upload PDF File (Cloudflare R2)
 </label>
 <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-border/50 rounded-xl hover:border-accent transition-colors relative">
 <input
 type="file"
 accept="application/pdf"
 onChange={(e) => {
 const file = e.target.files?.[0] || null;
 if (file) {
 if (file.type !== "application/pdf") {
 alert("Only PDF files are allowed!");
 return;
 }
 if (file.size > 15 * 1024 * 1024) {
 alert("File size exceeds the 15MB limit!");
 return;
 }
 setSelectedFile(file);
 }
 }}
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
 />
 <div className="space-y-1 text-center pointer-events-none">
 <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
 <div className="flex text-sm text-muted-foreground">
 <span className="relative rounded-md font-semibold text-accent hover:brightness-110">
 {selectedFile ? "Change file" : "Upload a file"}
 </span>
 <p className="pl-1">or drag and drop</p>
 </div>
 <p className="text-xs text-muted-foreground">PDF up to 15MB</p>
 </div>
 </div>

 {selectedFile && (
 <div className="mt-3 p-3 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-between animate-fade-in">
 <div className="min-w-0 flex-1">
 <p className="text-xs font-semibold text-accent truncate">
 {selectedFile.name}
 </p>
 <p className="text-[10px] text-accent/70">
 {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
 </p>
 </div>
 <Button
 variant="ghost"
 size="icon"
 onClick={() => setSelectedFile(null)}
 className="h-6 w-6 text-accent"
 >
 <X className="w-4 h-4" />
 </Button>
 </div>
 )}
 </div>
 )}

 {uploadSourceType === "drive" && (
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">
 Google Drive Link
 </label>
 <Input
 type="url"
 required
 value={fileUrl}
 onChange={(e: any) => setFileUrl(e.target.value)}
 placeholder="https://drive.google.com/..."
 />
 </div>
 )}

 {uploadSourceType === "external" && (
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">
 External PDF URL
 </label>
 <Input
 type="url"
 required
 value={fileUrl}
 onChange={(e: any) => setFileUrl(e.target.value)}
 placeholder="https://example.com/document.pdf"
 />
 </div>
 )}

 {uploadSourceType !== "file" && (
 <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-3">
 <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
 <div className="text-sm text-yellow-600 dark:text-yellow-400">
 <strong>Important:</strong> Please ensure the link is set to "Anyone with the link can view" before submitting. Your paper will be reviewed by an admin before being published to the Q-Bank.
 </div>
 </div>
 )}

 {isAdmin && (
 <div className="space-y-3 p-3 bg-muted/50 rounded-xl border border-border/50">
 <div className="flex items-center gap-2">
 <Checkbox
 id="queue-immediately"
 checked={queueImmediately}
 onCheckedChange={(checked) => setQueueImmediately(checked as boolean)}
 />
 <label htmlFor="queue-immediately" className="text-sm font-semibold text-foreground cursor-pointer">
 Queue for OCR immediately
 </label>
 </div>
 
 {queueImmediately && (
 <div className="pl-6 animate-fade-in space-y-1">
 <label className="block text-[11px] font-medium text-muted-foreground">
 Select AI Vision Model
 </label>
 <Select
 value={selectedModel}
 onChange={(e: any) => setSelectedModel(e.target.value)}
 options={[
 { value: "qwen2.5vl:3b", label: "Qwen 3B (Precise - LaTeX & Formulas)" },
 { value: "moondream", label: "Moondream (Fast - Low VRAM 4GB)" }
 ]}
 />
 </div>
 )}
 </div>
 )}
 </>
 ) : (
 <>
 {/* JSON Question Upload */}
 <div>
 <div className="flex justify-between items-center mb-1">
 <label className="block text-sm font-medium text-foreground">
 Questions JSON Array
 </label>
 <button
 type="button"
 onClick={handleInsertTemplate}
 className="text-xs text-accent hover:underline"
 >
 Insert Sample JSON
 </button>
 </div>
 <Textarea
 required
 rows={12}
 value={jsonText}
 onChange={(e: any) => setJsonText(e.target.value)}
 placeholder='[\n {\n "question_number": "1",\n "question_text": "...",\n "marks": 5\n }\n]'
 className="font-mono text-xs"
 />
 </div>
 </>
 )}

 {/* Submit */}
 <div className="pt-2">
 <Button
 type="submit"
 disabled={
 uploading || 
 !effectiveCourseCode || 
 !title || 
 (uploadMode === "file" && (
 (uploadSourceType === "file" && !selectedFile) ||
 (uploadSourceType !== "file" && !fileUrl)
 ))
 }
 className="w-full"
 >
 {uploading ? (
 <>
 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
 Uploading...
 </>
 ) : (
 <>
 <UploadCloud className="w-4 h-4 mr-2" /> Submit Paper
 </>
 )}
 </Button>
 </div>
 </form>
 )}
 </div>
 </div>
 );
}
