import { SelectOption } from "@/app/types/query";

export const tableOptions: SelectOption[] = [
  { value: "users", label: "users" },
  { value: "orders", label: "orders" },
  { value: "products", label: "products" },
  { value: "categories", label: "categories" },
  { value: "archived_users", label: "archived_users" },
];

export const columnOptions: SelectOption[] = [
  { value: "id", label: "id" },
  { value: "user_name", label: "user_name" },
  { value: "email", label: "email" },
  { value: "created_at", label: "created_at" },
  { value: "status", label: "status" },
  { value: "last_login", label: "last_login" },
  { value: "users.id", label: "users.id" },
  { value: "orders.user_id", label: "orders.user_id" },
  { value: "COUNT(*)", label: "COUNT(*)" },
  { value: "SUM(amount)", label: "SUM(amount)" },
];

export const operatorOptions: SelectOption[] = [
  { value: "=", label: "=" },
  { value: "!=", label: "!=" },
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
];

export const valueOptions: SelectOption[] = [
  { value: "'active'", label: "'active'" },
  { value: "'inactive'", label: "'inactive'" },
  { value: "'premium'", label: "'premium'" },
  { value: "'VIP'", label: "'VIP'" },
  { value: "1", label: "1" },
  { value: "5", label: "5" },
  { value: "10", label: "10" },
];

export const joinTypeOptions: SelectOption[] = [
  { value: "INNER JOIN", label: "INNER JOIN" },
  { value: "LEFT JOIN", label: "LEFT JOIN" },
  { value: "RIGHT JOIN", label: "RIGHT JOIN" },
  { value: "FULL OUTER JOIN", label: "FULL OUTER JOIN" },
];

export const unionTypeOptions: SelectOption[] = [
  { value: "UNION", label: "UNION" },
  { value: "UNION ALL", label: "UNION ALL" },
];

export const orderByOptions: SelectOption[] = [
  { value: "created_at ASC", label: "created_at ASC" },
  { value: "created_at DESC", label: "created_at DESC" },
  { value: "user_name ASC", label: "user_name ASC" },
  { value: "user_name DESC", label: "user_name DESC" },
];
