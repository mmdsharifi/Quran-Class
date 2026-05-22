import test from "node:test";
import assert from "node:assert/strict";
import { parseCSV, parseCSVLine } from "./utils/helpers.ts";

test("parseCSV parses empty strings and simple inputs", () => {
  assert.deepEqual(parseCSV(""), []);
  assert.deepEqual(parseCSV(" \n "), []);
  assert.deepEqual(parseCSV("a,b,c"), [["a", "b", "c"]]);
});

test("parseCSV handles standard multi-line CSV rows", () => {
  const csv = "id,name,notes\n1,Ali,Good student\n2,Mohammad,Practiced well";
  const result = parseCSV(csv);
  assert.deepEqual(result, [
    ["id", "name", "notes"],
    ["1", "Ali", "Good student"],
    ["2", "Mohammad", "Practiced well"]
  ]);
});

test("parseCSV handles carriage returns (CRLF / Windows newlines)", () => {
  const csv = "id,name\r\n1,Ali\r\n2,Mohammad";
  const result = parseCSV(csv);
  assert.deepEqual(result, [
    ["id", "name"],
    ["1", "Ali"],
    ["2", "Mohammad"]
  ]);
});

test("parseCSV preserves spaces inside quotes but trims outer spaces", () => {
  const csv = ' id , " name with space " , "quoted"';
  const result = parseCSV(csv);
  assert.deepEqual(result, [
    ["id", " name with space ", "quoted"]
  ]);
});

test("parseCSV handles commas inside quoted fields", () => {
  const csv = '1,"Ali, Mohammad",5';
  const result = parseCSV(csv);
  assert.deepEqual(result, [
    ["1", "Ali, Mohammad", "5"]
  ]);
});

test("parseCSV handles escaped double quotes inside quoted fields", () => {
  const csv = '1,"He said ""Salam"" to me",5';
  const result = parseCSV(csv);
  assert.deepEqual(result, [
    ["1", 'He said "Salam" to me', "5"]
  ]);
});

test("parseCSV handles newlines inside quoted fields", () => {
  const csv = '1,"Line 1\nLine 2",5\n2,Yousef,3';
  const result = parseCSV(csv);
  assert.deepEqual(result, [
    ["1", "Line 1\nLine 2", "5"],
    ["2", "Yousef", "3"]
  ]);
});

test("parseCSVLine splits single CSV line correctly", () => {
  assert.deepEqual(parseCSVLine("a,b,c"), ["a", "b", "c"]);
  assert.deepEqual(parseCSVLine('"a,b",c'), ["a,b", "c"]);
  assert.deepEqual(parseCSVLine('"a ""b""",c'), ['a "b"', "c"]);
});
