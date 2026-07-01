import React, { useState } from "react";
import { X, UploadCloud, AlertCircle, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";

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
 <div className={`bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full transition-all duration-300 ${isAdmin && uploadMode === "json" ? "max-w-2xl" : "max-w-md"}`}>
 {/* Header */}
 <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 ">
 <div>
 <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 ">Upload Past Paper</h2>
 {isAdmin && <span className="inline-block mt-1 bg-green-100 text-green-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">Admin Mode</span>}
 </div>
 <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Tabs for Admins */}
 {isAdmin && !success && (
 <div className="flex border-b border-gray-100 dark:border-gray-800 px-5">
 <button
 type="button"
 onClick={() => setUploadMode("file")}
 className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-all ${
 uploadMode === "file"
 ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
 : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
 }`}
 >
 PDF Link Mode
 </button>
 <button
 type="button"
 onClick={() => setUploadMode("json")}
 className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-all ${
 uploadMode === "json"
 ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
 : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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
 <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Upload Successful!</h3>
 <p className="text-gray-500 dark:text-gray-400 text-sm">
 {uploadMode === "json"
 ? "Your paper and questions have been imported directly into the Admin review queue."
 : queueImmediately
 ? `Your paper has been uploaded and queued for OCR processing using ${selectedModel === "moondream" ? "Moondream" : "Qwen 3B"}.`
 : "Your paper has been sent to the Admin queue for question extraction and approval."}
 </p>
 {uploadMode === "file" && selectedFile && (
 <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-gray-800 rounded-xl text-left w-full text-xs space-y-1 text-gray-600 dark:text-gray-300">
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
 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 ">Course Code</label>
 <button
 type="button"
 onClick={() => setUseCustomCode(!useCustomCode)}
 className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
 >
 <Plus className="w-3 h-3" />
 {useCustomCode ? "Select from list" : "Enter custom code"}
 </button>
 </div>
 {useCustomCode ? (
 <input
 type="text"
 required
 value={customCourseCode}
 onChange={(e) => setCustomCourseCode(e.target.value)}
 placeholder="e.g. CSE2001"
 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase placeholder:normal-case"
 />
 ) : (
 <select
 required
 value={courseCode}
 onChange={(e) => setCourseCode(e.target.value)}
 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
 >
 <option value="" disabled>Select a course</option>
 {courses.map((c: any) => (
 <option key={c.code} value={c.code}>
 {c.code} - {c.title}
 </option>
 ))}
 </select>
 )}
 </div>

 {/* Paper Type + Sem + Year */}
 <div className="grid grid-cols-3 gap-3">
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
 <select
 value={paperType}
 onChange={(e) => setPaperType(e.target.value)}
 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
 >
 <option>CAT 1</option>
 <option>CAT 2</option>
 <option>FAT</option>
 <option>Quiz</option>
 <option>Assignment</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sem</label>
 <select
 value={semester}
 onChange={(e) => setSemester(e.target.value)}
 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
 >
 <option>Fall</option>
 <option>Winter</option>
 <option>Summer</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
 <input
 type="number"
 required
 value={year}
 onChange={(e) => setYear(e.target.value)}
 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
 />
 </div>
 </div>

 {/* Title */}
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
 <input
 type="text"
 required
 placeholder="e.g. Winter Semester FAT Question Paper"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
 />
 </div>

 {/* Conditional input fields based on mode */}
 {uploadMode === "file" ? (
 <>
 {/* Document Source Selection */}
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
 Document Source
 </label>
 <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
 <button
 type="button"
 onClick={() => { setUploadSourceType("file"); setFileUrl(""); }}
 className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
 uploadSourceType === "file"
 ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm"
 : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
 }`}
 >
 PDF Upload
 </button>
 <button
 type="button"
 onClick={() => { setUploadSourceType("drive"); setSelectedFile(null); }}
 className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
 uploadSourceType === "drive"
 ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm"
 : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
 }`}
 >
 Google Drive
 </button>
 <button
 type="button"
 onClick={() => { setUploadSourceType("external"); setSelectedFile(null); }}
 className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
 uploadSourceType === "external"
 ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm"
 : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
 }`}
 >
 External URL
 </button>
 </div>
 </div>

 {/* Conditional Inputs */}
 {uploadSourceType === "file" && (
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
 Upload PDF File (Cloudflare R2)
 </label>
 <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-colors relative">
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
 <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
 <div className="flex text-sm text-gray-600 dark:text-gray-400">
 <span className="relative rounded-md font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500">
 {selectedFile ? "Change file" : "Upload a file"}
 </span>
 <p className="pl-1">or drag and drop</p>
 </div>
 <p className="text-xs text-gray-500">PDF up to 15MB</p>
 </div>
 </div>

 {selectedFile && (
 <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl flex items-center justify-between animate-fade-in">
 <div className="min-w-0 flex-1">
 <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 truncate">
 {selectedFile.name}
 </p>
 <p className="text-[10px] text-blue-500">
 {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
 </p>
 </div>
 <button
 type="button"
 onClick={() => setSelectedFile(null)}
 className="p-1 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 )}
 </div>
 )}

 {uploadSourceType === "drive" && (
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
 Google Drive Link
 </label>
 <input
 type="url"
 required
 value={fileUrl}
 onChange={(e) => setFileUrl(e.target.value)}
 placeholder="https://drive.google.com/..."
 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
 />
 </div>
 )}

 {uploadSourceType === "external" && (
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
 External PDF URL
 </label>
 <input
 type="url"
 required
 value={fileUrl}
 onChange={(e) => setFileUrl(e.target.value)}
 placeholder="https://example.com/document.pdf"
 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
 />
 </div>
 )}

 {uploadSourceType !== "file" && (
 <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-3 flex items-start gap-3">
 <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
 <div className="text-sm text-yellow-800 dark:text-yellow-200">
 <strong>Important:</strong> Please ensure the link is set to "Anyone with the link can view" before submitting. Your paper will be reviewed by an admin before being published to the Q-Bank.
 </div>
 </div>
 )}

 {isAdmin && (
 <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-gray-200 dark:border-gray-800 ">
 <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200 cursor-pointer">
 <input
 type="checkbox"
 checked={queueImmediately}
 onChange={(e) => setQueueImmediately(e.target.checked)}
 className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
 />
 Queue for OCR immediately
 </label>
 
 {queueImmediately && (
 <div className="pl-6 animate-fade-in space-y-1">
 <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400">
 Select AI Vision Model
 </label>
 <select
 value={selectedModel}
 onChange={(e) => {
 setSelectedModel(e.target.value);
 }}
 className="relative z-10 cursor-pointer pointer-events-auto w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 "
 >
 <option value="qwen2.5vl:3b" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 ">Qwen 3B (Precise - LaTeX & Formulas)</option>
 <option value="moondream" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 ">Moondream (Fast - Low VRAM 4GB)</option>
 </select>
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
 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 ">
 Questions JSON Array
 </label>
 <button
 type="button"
 onClick={handleInsertTemplate}
 className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
 >
 Insert Sample JSON
 </button>
 </div>
 <textarea
 required
 rows={12}
 value={jsonText}
 onChange={(e) => setJsonText(e.target.value)}
 placeholder='[\n {\n "question_number": "1",\n "question_text": "...",\n "marks": 5\n }\n]'
 className="w-full px-3 py-2 font-mono text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
 />
 </div>
 </>
 )}

 {/* Submit */}
 <div className="pt-2">
 <button
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
 className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
 >
 {uploading ? (
 <>
 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
 Uploading...
 </>
 ) : (
 <>
 <UploadCloud className="w-5 h-5" /> Submit Paper
 </>
 )}
 </button>
 </div>
 </form>
 )}
 </div>
 </div>
 );
}

