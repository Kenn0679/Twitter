import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { MediaTypeQuery, PeopleFollow } from '~/constants/enums';
import { SearchQuery } from '~/models/requests/Search.request';
import searchService from '~/services/search.services';

export const searchController = async (req: Request<ParamsDictionary, any, any, SearchQuery>, res: Response) => {
  const limit = Number(req.query.limit);
  const page = Number(req.query.page);
  const result = await searchService.search({
    limit,
    page,
    content: req.query.content,
    user_id: req.decoded_authorization?.user_id as string,
    media_type: req.query.media_type?.toLowerCase() as MediaTypeQuery,
    people_follow: req.query.people_follow as PeopleFollow
  });
  return res.json({ message: 'Search results fetched successfully', data: result });
};
