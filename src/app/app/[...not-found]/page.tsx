import { notFound } from 'next/navigation';
import NotFoundPage from '../not-found';

export default function CatchAllNotFound() {
	// This directly renders our custom 404 page for any nested path
	notFound();
}
