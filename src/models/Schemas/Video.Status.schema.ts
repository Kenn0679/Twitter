import { ObjectId } from 'mongodb';
import { EncodingStatus } from '~/constants/enums';

interface VideoStatusType {
  _id?: ObjectId;
  name: string;
  status: EncodingStatus;
  message?: string;
  created_at?: Date;
  updated_at?: Date;
}

export default class VideoStatusSchema {
  _id?: ObjectId;
  name: string; //tên thư mục video HSL
  status: EncodingStatus;
  message: string; //thông báo trong trường hợp thất bại
  created_at: Date;
  updated_at: Date;

  constructor({ name, status, created_at, updated_at, _id, message }: VideoStatusType) {
    const date = new Date();
    this._id = _id;
    this.status = status;
    this.name = name;
    this.message = message || '';
    this.created_at = created_at || date;
    this.updated_at = updated_at || date;
  }
}
