import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Post {
  id: number;
  author: string;
  category: string;
  content: string;
  likes: number;
  liked: boolean;
  comments: string[];
  commentInput: string;
}

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './community.component.html',
  styleUrl: './community.component.css'
})
export class CommunityComponent {
  // Demo mode only. Connect this to your real verified-user API.
  verified = false;

  category = 'All';
  selectedCategory = 'Stories';
  newPost = '';

  categories = ['All', 'Routes', 'Destinations', 'Travel Tips', 'Stories'];

  posts: Post[] = [
    {
      id: 1,
      author: 'Travel Explorer',
      category: 'Travel Tips',
      content: 'Keep your booking confirmation handy and arrive early at your boarding point.',
      likes: 12,
      liked: false,
      comments: [],
      commentInput: ''
    },
    {
      id: 2,
      author: 'Road Tripper',
      category: 'Destinations',
      content: 'Share your favourite weekend getaway destinations with fellow travellers!',
      likes: 8,
      liked: false,
      comments: [],
      commentInput: ''
    }
  ];

  get filteredPosts(): Post[] {
    const posts = this.category === 'All'
      ? this.posts
      : this.posts.filter(p => p.category === this.category);

    return [...posts].sort((a, b) => b.likes - a.likes);
  }

  createPost(): void {
    if (!this.verified || !this.newPost.trim()) return;

    this.posts.unshift({
      id: Date.now(),
      author: 'You',
      category: this.selectedCategory,
      content: this.newPost.trim(),
      likes: 0,
      liked: false,
      comments: [],
      commentInput: ''
    });

    this.newPost = '';
  }

  toggleLike(post: Post): void {
    if (!this.verified) return;
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
  }

  addComment(post: Post): void {
    if (!this.verified || !post.commentInput.trim()) return;
    post.comments.push(post.commentInput.trim());
    post.commentInput = '';
  }

  reportPost(post: Post): void {
    const reason = window.prompt('Why are you reporting this post?');
    if (reason?.trim()) {
      window.alert('Demo only: connect this action to the report API.');
    }
  }

  sharePost(post: Post): void {
    const url = `${window.location.origin}/community#post-${post.id}`;

    if (navigator.share) {
      navigator.share({
        title: 'TEDBUS Travel Community',
        text: post.content,
        url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url)
        .then(() => window.alert('Post link copied!'))
        .catch(() => window.alert(url));
    }
  }
}