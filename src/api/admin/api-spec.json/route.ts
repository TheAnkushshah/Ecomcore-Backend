import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { specs } from "../../docs/swagger";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.send(specs)
}
