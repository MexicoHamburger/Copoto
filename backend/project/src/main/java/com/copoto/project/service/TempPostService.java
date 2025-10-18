package com.copoto.project.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.copoto.project.entity.TempPost;
import com.copoto.project.entity.User;
import com.copoto.project.repository.TempPostRepository;

@Service
public class TempPostService {

    @Autowired
    private TempPostRepository tempPostRepository;

    @Transactional
    public TempPost saveTempPost(User user, String title, String contents) {
        long count = tempPostRepository.countByUser(user);
        if (count >= 10) {
            // 가장 오래된 것 삭제
            List<TempPost> posts = tempPostRepository.findByUserOrderByCreatedAtAsc(user);
            tempPostRepository.delete(posts.get(0));
        }

        TempPost tempPost = new TempPost();
        tempPost.setUser(user);
        tempPost.setTitle(title);
        tempPost.setContents(contents);
        tempPost.setTempOrder((int) (System.currentTimeMillis() / 1000));

        return tempPostRepository.save(tempPost);
    }

    public List<TempPost> getTempList(User user) {
        return tempPostRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public TempPost getTempPost(Long id, User user) {
        TempPost post = tempPostRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("TempPost not found"));
        if (!post.getUser().getId().equals(user.getId()))
            throw new SecurityException("Access denied");
        return post;
    }

    public void deleteTempPost(Long id, User user) {
        TempPost post = tempPostRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("TempPost not found"));
        if (!post.getUser().getId().equals(user.getId()))
            throw new SecurityException("Access denied");
        tempPostRepository.delete(post);
    }
}
