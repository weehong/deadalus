import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import i18n from "@/common/i18n";
import {
	parseDrawingFilename,
	summarizeQueue,
	type UploadQueueItem,
} from "./model";
import { UploadQueue } from "./UploadQueue";

describe("drawing uploads", () => {
	it.each([
		["A-101 rev B.pdf", "Architectural", "B"],
		["S_200_REV03.dwg", "Structural", "03"],
		["notes.rvt", "Unassigned", null],
	])("parses %s", (name, discipline, revision) => {
		expect(parseDrawingFilename(name)).toEqual({ discipline, revision });
	});
	it("derives the batch summary", () => {
		const item = {
			file: new File(["1234"], "A-1.pdf"),
			progress: 50,
		} as UploadQueueItem;
		expect(summarizeQueue([item])).toEqual({
			documents: 1,
			totalBytes: 4,
			uploadedBytes: 2,
		});
	});
	it("renders queue data supplied as props", () => {
		const item = {
			id: "1",
			file: new File(["x"], "A-1.pdf"),
			metadata: { discipline: "Architectural", revision: null },
			progress: 25,
			state: "uploading",
		} satisfies UploadQueueItem;
		render(
			<UploadQueue
				items={[item]}
				onRemove={() => undefined}
				onRetry={() => undefined}
			/>
		);
		expect(screen.getByText("A-1.pdf")).toBeTruthy();
		expect(screen.getByText("25%")).toBeTruthy();
	});
	it("offers removal only while queued and retry after failure", () => {
		const onRemove = vi.fn();
		const onRetry = vi.fn();
		const queued = {
			id: "queued",
			file: new File(["x"], "A-1.pdf"),
			metadata: { discipline: "Architectural", revision: null },
			progress: 0,
			state: "queued",
		} satisfies UploadQueueItem;
		const failed = { ...queued, id: "failed", state: "failed" as const };
		render(
			<UploadQueue
				items={[queued, failed]}
				onRemove={onRemove}
				onRetry={onRetry}
			/>
		);
		fireEvent.click(screen.getByRole("button", { name: "Remove" }));
		fireEvent.click(screen.getByRole("button", { name: "Retry" }));
		expect(onRemove).toHaveBeenCalledWith("queued");
		expect(onRetry).toHaveBeenCalledWith("failed");
	});
	it("renders queue labels and disciplines in Simplified Chinese", async () => {
		await i18n.changeLanguage("zh-CN");
		const item = {
			id: "1",
			file: new File(["x"], "A-1.pdf"),
			metadata: { discipline: "Architectural", revision: null },
			progress: 0,
			state: "queued",
		} satisfies UploadQueueItem;
		render(
			<UploadQueue
				items={[item]}
				onRemove={() => undefined}
				onRetry={() => undefined}
			/>
		);
		expect(screen.getByRole("table", { name: "上传队列" })).toBeTruthy();
		expect(screen.getByText("建筑")).toBeTruthy();
		await i18n.changeLanguage("en-US");
	});
});
