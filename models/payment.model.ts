import { ObjectId } from "../deps.ts";
import { db_connection } from "../utils/mongodb.utils.ts";

interface InstitutionPaymentSchema {
	_id: ObjectId;
	institution_id: ObjectId;
	paid_at: Date;
	due_date: Date;
	ammount_paid: number;
	student_number_agreement: number;
	value_per_student_when_performed: number;
}

export const Payment = db_connection.collection<InstitutionPaymentSchema>("institution_payment");