import mongoose,{Schema} from "mongoose";
import Ireadings from "../interfaces/database/Readings";

const readinsSchema = new Schema<Ireadings>({
    id_plant: {
        type: Schema.Types.ObjectId,
        ref: 'Plants'
    },

    hydrogen: {
        type: Number,
        required: true
    },

    oxigen: {
        type: Number,
        required: true
    },

    ph: {
        type: Number,
        required: true,
    },

    temperature: {
        type: Number,
        required: true
    },

    register_date: {
        type: Date,
        default: Date.now
    }

});

export const ReadinsModel = mongoose.model('Readings', readinsSchema)